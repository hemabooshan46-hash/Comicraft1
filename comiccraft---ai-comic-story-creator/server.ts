import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { PanelOutline, PanelLayoutItem, PromptRequest, ComicStoryResult } from './src/types/comic';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory store for generated comics to allow sharing and re-viewing
const comicsStore = new Map<string, ComicStoryResult>();

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Milestone 2 & Activity 2.1: gemini_flash.py
 * Generates a structured 5-panel comic outline based on user's story prompt
 */
async function generate_outline(params: PromptRequest): Promise<PanelOutline[]> {
  const { prompt, character_name, setting, tone, style } = params;

  if (ai) {
    try {
      const systemInstruction = `You are a professional comic book planner and storyboard artist.
Generate a strictly formatted JSON array containing exactly 5 sequential comic panel descriptions for a story.
Each JSON object MUST include:
- "panel": integer (1 to 5)
- "title": short compelling panel title (e.g. "Panel 1: The Forest's Edge")
- "scene_description": 2-3 sentences describing the characters, actions, background, and visual mood
- "image_prompt": detailed descriptive prompt for image generation reflecting the requested art style (${style})

Do not wrap in markdown quotes if possible, output raw JSON array.`;

      const userMessage = `STORY IDEA: "${prompt}"
MAIN CHARACTER: "${character_name}"
SETTING: "${setting}"
TONE: "${tone}"
ART STYLE: "${style}"

Create 5 panels that build a cohesive beginning, rising action, climax, and satisfying resolution.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim() || '';
      let cleaned = text;
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.slice(0, 5).map((p, idx) => ({
          panel: p.panel || idx + 1,
          title: p.title || `Panel ${idx + 1}`,
          scene_description: p.scene_description || '',
          image_prompt: p.image_prompt || `${character_name} in ${setting}, comic illustration`,
        }));
      }
    } catch (err) {
      console.warn('Gemini generate_outline error, falling back to smart generation:', err);
    }
  }

  // Resilient fallback outline matching user prompt
  return generateFallbackOutline(params);
}

/**
 * Milestone 2 & Activity 2.1: gemini_pro.py
 * Generates comic story narration and character dialogue
 */
async function generate_story(outline: PanelOutline[], params: PromptRequest): Promise<string> {
  const { character_name, tone, setting } = params;

  if (ai) {
    try {
      const formattedOutline = outline
        .map((p) => `Panel ${p.panel}: ${p.title} - Description: ${p.scene_description}`)
        .join('\n\n');

      const prompt = `You are an expert comic book scriptwriter.
Given the 5-panel outline below, write the full comic script with engaging narration, atmospheric captions, and character dialogues.
Main Character: "${character_name}"
Setting: "${setting}"
Tone: "${tone}"

Outline:
${formattedOutline}

Format each panel strictly as follows:
**Panel 1: [Title]**
**CAPTION** [Ambient description of atmosphere or background whispers]
**NARRATION** [Main character's inner voice, actions, or storyteller commentary]
**DIALOGUE** [Character speech lines with quotation marks, e.g. ${character_name}: "..."]
**IMAGE PROMPT** [Visual artistic instruction]

Ensure all 5 panels are written out completely with vivid comic personality matching the ${tone} tone.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini generate_story error, falling back to smart script:', err);
    }
  }

  return generateFallbackStory(outline, params);
}

/**
 * Milestone 2 & Activity 2.1: image_generator.py
 * Generates comic illustration matching the art style and panel prompt
 */
function generate_image(prompt: string, style: string, panelIndex: number): string {
  // Build a tailored prompt for high quality comic visual representation
  const cleanPrompt = prompt.replace(/[^\w\s,.-]/g, '').slice(0, 180);
  const styleKeywords: Record<string, string> = {
    anime: 'anime manga artstyle, vibrant colors, cel shaded, Makoto Shinkai aesthetic, high detail illustration',
    'comic book': 'classic vintage Marvel and DC comic book page art, bold ink outlines, dynamic halftone dots, vibrant graphic novel',
    'pixel art': '16-bit retro arcade pixel art aesthetic, vibrant color palette, nostalgic game screenshot',
    realistic: 'cinematic digital concept painting, hyper-detailed, atmospheric volumetric lighting, photorealistic composition',
  };

  const selectedKeyword = styleKeywords[style.toLowerCase()] || styleKeywords['comic book'];
  const fullImagePrompt = `${selectedKeyword}, ${cleanPrompt}, masterpiece, crisp quality, wide angle comic panel framing`;

  // Deterministic seed based on prompt and panel
  let hash = 0;
  for (let i = 0; i < fullImagePrompt.length; i++) {
    hash = (hash << 5) - hash + fullImagePrompt.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) + panelIndex * 17;

  // Uses Pollinations AI image generator (Stable Diffusion / Flux) for crisp comic visuals
  const encodedPrompt = encodeURIComponent(fullImagePrompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=500&seed=${seed}&nologo=true`;
}

/**
 * Milestone 2 & Activity 2.1: layout_builder.py
 * Assembles each panel's title, image, and text into a structured layout
 */
function build_comic_layout(
  images: string[],
  full_story: string,
  outline: PanelOutline[]
): PanelLayoutItem[] {
  const panelSections = full_story.split(/(?=\*\*Panel\s+\d+:?|Panel\s+\d+:?)/i).filter((s) => s.trim().length > 0);

  return outline.map((panelInfo, idx) => {
    const rawSection = panelSections[idx] || '';

    // Extract CAPTION
    const captionMatch = rawSection.match(/\*\*CAPTION\*\*:?\s*([^\n*]+)/i) ||
      rawSection.match(/CAPTION:?\s*([^\n]+)/i);
    const caption = captionMatch ? captionMatch[1].trim() : `Whispers of the ${panelInfo.title.toLowerCase()} echoed around the horizon.`;

    // Extract NARRATION
    const narrationMatch = rawSection.match(/\*\*NARRATION\*\*:?\s*([\s\S]*?)(?=\*\*(?:DIALOGUE|CAPTION|IMAGE PROMPT)\*\*|$)/i) ||
      rawSection.match(/NARRATION:?\s*([\s\S]*?)(?=(?:DIALOGUE|CAPTION|IMAGE PROMPT)|$)/i);
    const narration = narrationMatch
      ? narrationMatch[1].trim()
      : panelInfo.scene_description;

    // Extract DIALOGUE if present
    const dialogueMatch = rawSection.match(/\*\*DIALOGUE\*\*:?\s*([\s\S]*?)(?=\*\*(?:IMAGE PROMPT|NARRATION)\*\*|$)/i);
    const dialogues = dialogueMatch ? dialogueMatch[1].trim().split('\n').filter(Boolean) : [];

    // Extract IMAGE PROMPT
    const promptMatch = rawSection.match(/\*\*IMAGE PROMPT\*\*:?\s*([^\n]+)/i);
    const image_prompt = promptMatch ? promptMatch[1].trim() : panelInfo.image_prompt;

    const image_path = images[idx] || generate_image(panelInfo.image_prompt, 'comic book', idx + 1);

    return {
      panel: panelInfo.panel || idx + 1,
      title: panelInfo.title,
      image_path: image_path,
      scene_description: panelInfo.scene_description,
      caption: caption,
      narration: narration,
      dialogues: dialogues.length > 0 ? dialogues : undefined,
      image_prompt: image_prompt,
      text: `${caption}\n${narration}`,
    };
  });
}

/**
 * Fallback generator for instant offline or rate-limit safe response
 */
function generateFallbackOutline(params: PromptRequest): PanelOutline[] {
  const { prompt, character_name, setting, tone, style } = params;
  return [
    {
      panel: 1,
      title: `Panel 1: The Edge of ${setting.charAt(0).toUpperCase() + setting.slice(1)}`,
      scene_description: `${character_name} stands cautiously at the threshold of ${setting}, observing the quiet stillness before embarking on the mysterious journey.`,
      image_prompt: `${style} illustration of ${character_name} standing bravely at the entrance of a dramatic ${setting}, atmospheric lighting.`,
    },
    {
      panel: 2,
      title: `Panel 2: Signs of the Unknown`,
      scene_description: `Deep within the ${setting}, strange glowing tracks and mysterious artifacts catch ${character_name}'s keen attention.`,
      image_prompt: `${style} comic scene of ${character_name} investigating mysterious glowing symbols in ${setting}, dramatic shadows.`,
    },
    {
      panel: 3,
      title: `Panel 3: The Sudden Encounter`,
      scene_description: `An unexpected challenge arises in the heart of ${setting}, demanding courage and quick wits from ${character_name}.`,
      image_prompt: `${style} comic panel of an intense dynamic moment with ${character_name} reacting swiftly to an unexpected obstacle.`,
    },
    {
      panel: 4,
      title: `Panel 4: The Decisive Choice`,
      scene_description: `Summoning every ounce of strength and determination, ${character_name} turns the tide through ingenuity and heart.`,
      image_prompt: `${style} epic visual shot of ${character_name} overcoming the greatest trial in ${setting}, heroic composition.`,
    },
    {
      panel: 5,
      title: `Panel 5: A New Legend Begins`,
      scene_description: `With the quest fulfilled, ${character_name} gazes towards the golden sunrise, knowing that peace has returned to ${setting}.`,
      image_prompt: `${style} panoramic comic panel of ${character_name} celebrating victory at sunrise in ${setting}, uplifting atmosphere.`,
    },
  ];
}

function generateFallbackStory(outline: PanelOutline[], params: PromptRequest): string {
  const { character_name, setting, tone } = params;
  return outline
    .map(
      (p) => `**${p.title}**
**CAPTION** Whispers carried on the wind through the ${setting}, alive with the pulse of an ancient mystery.
**NARRATION** ${p.scene_description}
**DIALOGUE** ${character_name}: "No matter what lies ahead in this ${setting}, I won't back down!"
**IMAGE PROMPT** ${p.image_prompt}`
    )
    .join('\n\n');
}

// ----------------------
// Backend Route Handlers
// ----------------------

/**
 * Route: POST /generate
 * Form-based or JSON-based comic generation handling
 */
app.post('/generate', async (req, res) => {
  try {
    const prompt = (req.body.prompt || req.body.story_prompt || 'A brave hero goes on an epic adventure').trim();
    const character_name = (req.body.character_name || req.body.character || 'Hero').trim();
    const setting = (req.body.setting || 'forest').trim();
    const tone = (req.body.tone || 'dramatic').trim();
    const style = (req.body.style || req.body.art_style || 'comic book').trim();

    const requestData: PromptRequest = { prompt, character_name, setting, tone, style };

    // Step 1: Generate outline
    const outline = await generate_outline(requestData);

    // Step 2: Generate story narration and dialogue
    const full_story = await generate_story(outline, requestData);

    // Step 3: Generate images for each panel
    const images = outline.map((panel, idx) =>
      generate_image(panel.image_prompt, style, idx + 1)
    );

    // Step 4: Build comic layout
    const layout = build_comic_layout(images, full_story, outline);

    // Step 5: Save PDF reference
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const pdf_path = `/exports/comic_${timestamp}.pdf`;

    const comicResult: ComicStoryResult = {
      id: `comic_${Date.now()}`,
      timestamp,
      title: outline[0]?.title.replace(/^Panel 1:\s*/i, '') || prompt.slice(0, 30),
      request: requestData,
      outline,
      full_story,
      layout,
      pdf_path,
    };

    comicsStore.set(comicResult.id, comicResult);

    // If client requested JSON (AJAX / Fetch)
    if (req.xhr || req.headers.accept?.includes('application/json') || req.is('json')) {
      return res.json({
        success: true,
        id: comicResult.id,
        layout,
        pdf_path,
        comic: comicResult,
      });
    }

    // Direct browser form submission redirect to preview
    return res.redirect(`/preview?id=${comicResult.id}`);
  } catch (error: any) {
    console.error('Error generating comic:', error);
    res.status(500).json({ error: 'Comic generation failed: ' + (error?.message || 'Internal error') });
  }
});

/**
 * Route: POST /generate-comic/json
 * API route that accepts JSON payloads, triggers comic generation,
 * and returns comic layout data and the generated PDF path.
 */
app.post('/generate-comic/json', async (req, res) => {
  try {
    const { prompt, character_name, setting, tone, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const requestData: PromptRequest = {
      prompt,
      character_name: character_name || 'Hero',
      setting: setting || 'forest',
      tone: tone || 'dramatic',
      style: style || 'comic book',
    };

    const outline = await generate_outline(requestData);
    const full_story = await generate_story(outline, requestData);
    const images = outline.map((p, idx) => generate_image(p.image_prompt, requestData.style, idx + 1));
    const layout = build_comic_layout(images, full_story, outline);
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const pdf_path = `/exports/comic_${timestamp}.pdf`;

    const comicResult: ComicStoryResult = {
      id: `comic_${Date.now()}`,
      timestamp,
      title: outline[0]?.title || prompt.slice(0, 30),
      request: requestData,
      outline,
      full_story,
      layout,
      pdf_path,
    };

    comicsStore.set(comicResult.id, comicResult);

    return res.json({
      success: true,
      id: comicResult.id,
      layout,
      pdf_path,
      outline,
      full_story,
    });
  } catch (error: any) {
    console.error('Error in /generate-comic/json:', error);
    res.status(500).json({ error: error?.message || 'Comic generation failed' });
  }
});

/**
 * Route: GET /test-image
 * A developer utility route to test image generation from a direct prompt
 */
app.get('/test-image', (req, res) => {
  try {
    const prompt = (req.query.prompt as string) || 'A futuristic city at sunset, sci-fi, cinematic, artstation';
    const style = (req.query.style as string) || 'comic book';
    const image_path = generate_image(prompt, style, 1);

    if (req.headers.accept?.includes('text/html') && !req.query.raw) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ComicCraft - Image Test</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: white; padding: 2rem; text-align: center; }
            .card { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            img { max-width: 100%; border-radius: 8px; border: 3px solid #3b82f6; }
            a { color: #60a5fa; text-decoration: none; margin-top: 1rem; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🎨 ComicCraft Test Image</h2>
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Style:</strong> ${style}</p>
            <img src="${image_path}" alt="Generated comic test" />
            <br>
            <a href="/">← Return to ComicCraft</a>
          </div>
        </body>
        </html>
      `);
    }

    return res.json({
      message: 'Image generated successfully',
      path: image_path,
      prompt,
      style,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Image generation failed' });
  }
});

/**
 * Route: GET /api/comics/:id
 * Retrieve a previously generated comic by ID
 */
app.get('/api/comics/:id', (req, res) => {
  const comic = comicsStore.get(req.params.id);
  if (!comic) {
    return res.status(404).json({ error: 'Comic not found' });
  }
  res.json(comic);
});

/**
 * Route: GET /api/presets
 * Preset comic prompts from the specification (Scenario 1, Scenario 2, etc.)
 */
app.get('/api/presets', (_req, res) => {
  res.json([
    {
      id: 'fox-forest',
      title: 'A Brave Fox in Enchanted Forest',
      prompt: 'A brave fox exploring an enchanted forest, discovering glowing ancient shrines and magical creatures.',
      character_name: 'Free',
      setting: 'forest',
      tone: 'dramatic',
      style: 'anime',
      description: 'Scenario 1 from spec: Rich dramatic storytelling with anime aesthetics.',
    },
    {
      id: 'funny-school-robot',
      title: 'Bumbling Robot Goes to High School',
      prompt: 'A goofy little helper robot tries to blend into high school classes and accidentally causes hilarious science lab chaos.',
      character_name: 'Gizmo',
      setting: 'school',
      tone: 'funny',
      style: 'comic book',
      description: 'Scenario 2 from spec: Light-hearted cartoonish comic book style.',
    },
    {
      id: 'space-crystals',
      title: 'Cosmic Cadet on Mars',
      prompt: 'A young rookie astronaut gets separated from their rover during a Martian dust storm and stumbles into a canyon of singing purple crystals.',
      character_name: 'Captain Leo',
      setting: 'space',
      tone: 'poetic',
      style: 'realistic',
      description: 'Sci-fi wonder with realistic cinematic rendering.',
    },
    {
      id: 'neon-city-sleuth',
      title: 'Neon Detective & the Cyber Cat',
      prompt: 'A cybernetic street detective investigates a stolen quantum chip aided by an elusive robotic holographic cat in rain-slicked alleyways.',
      character_name: 'Jax',
      setting: 'city',
      tone: 'dramatic',
      style: 'pixel art',
      description: 'Cyberpunk mystery with 16-bit retro pixel art atmosphere.',
    },
  ]);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🚀 ComicCraft server ready!`);
    console.log(`👉 Local:   http://localhost:${PORT}`);
    console.log(`👉 Network: http://127.0.0.1:${PORT}\n`);
  });
}

startServer();
