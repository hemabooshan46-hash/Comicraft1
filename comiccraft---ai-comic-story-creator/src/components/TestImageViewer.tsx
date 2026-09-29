import React, { useState } from 'react';
import { ArtStyleType } from '../types/comic';
import { Sparkles, Image as ImageIcon, Send, RefreshCw, Copy, Check, ArrowLeft } from 'lucide-react';

interface TestImageViewerProps {
  onBack: () => void;
}

export const TestImageViewer: React.FC<TestImageViewerProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState(
    'A futuristic city at sunset, sci-fi, cinematic, artstation'
  );
  const [style, setStyle] = useState<ArtStyleType>('comic book');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    'A futuristic city at sunset, sci-fi, cinematic, artstation',
    'A brave red fox wearing a magical amulet in an enchanted glowing forest',
    'A retro cartoon robot drinking tea with alien students in high school cafeteria',
    'A cyberpunk detective inspecting holographic clues in rainy neon Tokyo',
  ];

  const handleGenerate = async (targetPrompt = prompt, targetStyle = style) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/test-image?prompt=${encodeURIComponent(targetPrompt)}&style=${encodeURIComponent(targetStyle)}`
      );
      const data = await res.json();
      if (data.path) {
        setImageUrl(data.path);
      }
    } catch (e) {
      console.error('Test image error:', e);
      // Fallback direct url
      const encoded = encodeURIComponent(`${targetStyle} style, ${targetPrompt}`);
      setImageUrl(`https://image.pollinations.ai/prompt/${encoded}?width=800&height=500&nologo=true`);
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to ComicCraft
          </button>
          <div className="text-xs font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60 px-3 py-1 rounded-full">
            Route: GET /test-image
          </div>
        </div>

        {/* Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                ComicCraft Image Generator Testing Suite
              </h1>
              <p className="text-xs text-slate-400">
                Direct prompt illustration testing route from Milestone 2 & 3 specification.
              </p>
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Image Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter descriptive prompt for illustration..."
            />
          </div>

          {/* Quick preset buttons */}
          <div>
            <span className="text-xs text-slate-400 block mb-1.5 font-medium">Quick Prompts:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(s);
                    handleGenerate(s, style);
                  }}
                  className="text-xs bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-600 transition-colors truncate max-w-xs cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Visual Art Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as ArtStyleType)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="comic book">Classic Comic Book (Halftone & Inks)</option>
                <option value="anime">Anime / Manga (Cel-shaded)</option>
                <option value="pixel art">16-Bit Pixel Art</option>
                <option value="realistic">Realistic Digital Painting</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Art...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Test Image Generation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output Display */}
        {imageUrl && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generated Image Output
              </h3>

              <button
                onClick={copyUrl}
                className="text-xs inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied URL' : 'Copy Image Link'}
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-black max-h-[500px] flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Test generation"
                className="w-full h-auto object-contain max-h-[500px]"
              />
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded-lg break-all">
              <span className="text-slate-500">Image Path: </span>
              {imageUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
