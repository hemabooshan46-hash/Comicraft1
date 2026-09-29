import React, { useState } from 'react';
import { PromptRequest, SettingType, ToneType, ArtStyleType } from '../types/comic';
import { Sparkles, Wand2, Compass, Palette, BookOpen, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface ComicFormProps {
  onGenerate: (data: PromptRequest) => Promise<void>;
  isLoading: boolean;
  currentStepMessage?: string;
  stepNumber?: number;
}

const SETTINGS: { id: SettingType; label: string; icon: string }[] = [
  { id: 'forest', label: 'Enchanted Forest', icon: '🌲' },
  { id: 'school', label: 'High School', icon: '🏫' },
  { id: 'space', label: 'Deep Space', icon: '🚀' },
  { id: 'city', label: 'Cyber City', icon: '🏙️' },
];

const TONES: { id: ToneType; label: string; badge: string }[] = [
  { id: 'dramatic', label: 'Dramatic', badge: '⚡ High Stakes' },
  { id: 'light-hearted', label: 'Light-hearted', badge: '☀️ Uplifting' },
  { id: 'poetic', label: 'Poetic', badge: '✨ Dreamy' },
  { id: 'funny', label: 'Funny', badge: '😂 Humorous' },
];

const ART_STYLES: { id: ArtStyleType; label: string; sample: string }[] = [
  { id: 'comic book', label: 'Classic Comic Book', sample: 'Half-tone dots, bold dynamic inks' },
  { id: 'anime', label: 'Anime / Manga', sample: 'Vibrant cel-shaded, expressive eyes' },
  { id: 'pixel art', label: '16-Bit Pixel Art', sample: 'Retro arcade palette, crisp tiles' },
  { id: 'realistic', label: 'Realistic Digital Art', sample: 'Cinematic lighting, rich textures' },
];

const PRESETS = [
  {
    title: 'Scenario 1: Brave Fox',
    prompt: 'A brave fox exploring an enchanted forest, uncovering glowing ancient ruins.',
    character: 'Free',
    setting: 'forest',
    tone: 'dramatic',
    style: 'anime',
  },
  {
    title: 'Scenario 2: School Robot',
    prompt: 'A bumbling cartoon helper robot attends high school classes and accidentally creates a giant foam explosion in chemistry lab.',
    character: 'Gizmo',
    setting: 'school',
    tone: 'funny',
    style: 'comic book',
  },
  {
    title: 'Scenario 3: Mars Crystal Miner',
    prompt: 'A rookie astronaut gets lost in a Martian storm and discovers a cavern of resonant singing amethyst crystals.',
    character: 'Captain Leo',
    setting: 'space',
    tone: 'poetic',
    style: 'realistic',
  },
];

export const ComicForm: React.FC<ComicFormProps> = ({
  onGenerate,
  isLoading,
  currentStepMessage,
  stepNumber = 1,
}) => {
  const [prompt, setPrompt] = useState('A brave fox exploring an enchanted forest.');
  const [characterName, setCharacterName] = useState('Free');
  const [setting, setSetting] = useState<SettingType>('forest');
  const [customSetting, setCustomSetting] = useState('');
  const [tone, setTone] = useState<ToneType>('dramatic');
  const [style, setStyle] = useState<ArtStyleType>('anime');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !characterName.trim()) return;

    onGenerate({
      prompt: prompt.trim(),
      character_name: characterName.trim(),
      setting: customSetting.trim() || setting,
      tone,
      style,
    });
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setCharacterName(preset.character);
    setSetting(preset.setting);
    setCustomSetting('');
    setTone(preset.tone);
    setStyle(preset.style);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Scenic Background with subtle overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=80')`,
          filter: 'brightness(0.85) contrast(1.05)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-sky-950/30 to-slate-900/60" />
      </div>

      {/* Main Centered Form Card */}
      <div className="relative z-10 w-full max-w-xl mx-auto my-8">
        {/* Quick Scenario Fill Chips */}
        <div className="mb-3 flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
          <span className="text-xs font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 whitespace-nowrap">
            💡 Quick Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs font-medium bg-white/90 hover:bg-white text-slate-800 hover:text-blue-600 px-3 py-1 rounded-full shadow transition-all duration-150 whitespace-nowrap hover:scale-105 active:scale-95"
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 p-6 sm:p-8 transition-all">
          {/* Card Header matching page 21 */}
          <div className="text-center mb-6 pb-4 border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2 shadow-inner">
              <Wand2 className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
              <span className="text-blue-600 font-serif">✏️</span> Create Your Comic
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Transform your story prompt into a 5-panel comic with AI dialogue, narration, and illustrations.
            </p>
          </div>

          {isLoading ? (
            <div className="py-10 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <Sparkles className="w-8 h-8 text-blue-600 absolute inset-0 m-auto animate-bounce" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Crafting Your Comic Book...
                </h3>
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {currentStepMessage || 'Step 1/5: Gemini generating panel storyline...'}
                </p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(stepNumber / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Step {stepNumber} of 5</span>
                  <span>{Math.round((stepNumber / 5) * 100)}% Complete</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 text-left border border-slate-200/60 max-w-md mx-auto space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Active AI Workflow:
                </div>
                <div className="space-y-1 pl-6 list-disc list-inside text-slate-500">
                  <div className={stepNumber >= 1 ? 'text-blue-700 font-medium' : ''}>
                    • <strong>Gemini Flash:</strong> 5-panel outline & image cues
                  </div>
                  <div className={stepNumber >= 2 ? 'text-blue-700 font-medium' : ''}>
                    • <strong>Gemini Pro:</strong> Narration, captions & dialogues
                  </div>
                  <div className={stepNumber >= 3 ? 'text-blue-700 font-medium' : ''}>
                    • <strong>Comic Engine:</strong> High-res styled panel illustrations
                  </div>
                  <div className={stepNumber >= 4 ? 'text-blue-700 font-medium' : ''}>
                    • <strong>Layout Builder:</strong> Binding titles, images & stories
                  </div>
                  <div className={stepNumber >= 5 ? 'text-blue-700 font-medium' : ''}>
                    • <strong>Exporter:</strong> PDF compilation ready
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Field 1: Story Prompt */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Story Prompt</span>
                  <span className="text-[11px] font-normal text-slate-400">Main comic idea</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A brave fox exploring an enchanted forest, discovering ancient hidden secrets."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Field 2: Main Character Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Main Character Name</span>
                  <span className="text-[11px] font-normal text-slate-400">Hero of the comic</span>
                </label>
                <input
                  type="text"
                  required
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g. Free, Finn, Gizmo, Maya"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Field 3: Setting */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Setting</span>
                  <span className="text-[11px] font-normal text-slate-400">Location of the story</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {SETTINGS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSetting(item.id);
                        setCustomSetting('');
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                        setting === item.id && !customSetting
                          ? 'border-blue-600 bg-blue-50/80 text-blue-800 font-semibold shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customSetting}
                  onChange={(e) => setCustomSetting(e.target.value)}
                  placeholder="Or enter custom setting (e.g. underwater castle, desert canyon)..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Field 4 & 5: Tone & Art Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Story Tone */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    Story Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ToneType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    {TONES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Art Style */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    Art Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ArtStyleType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    {ART_STYLES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button matching page 21 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Comic
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
