import React, { useState } from 'react';
import { ComicStoryResult, PanelLayoutItem } from '../types/comic';
import { exportComicToPdf } from '../services/pdfExporter';
import {
  Download,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Maximize2,
  FileCode,
  Volume2,
  VolumeX,
  Share2,
  Check,
  RefreshCw,
} from 'lucide-react';

interface ComicPreviewProps {
  comic: ComicStoryResult;
  onBackToHome: () => void;
  onExportSuccess: (filename: string) => void;
}

export const ComicPreview: React.FC<ComicPreviewProps> = ({
  comic,
  onBackToHome,
  onExportSuccess,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const filename = await exportComicToPdf(comic);
      setIsExporting(false);
      // Automatically redirect to the Comic Export Success Page (as specified in Scenario 3 & Page 24)
      onExportSuccess(filename);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setIsExporting(false);
      alert('PDF generation failed. Please try again.');
    }
  };

  const handleReadAloud = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (activeSpeechIndex === index) {
        setActiveSpeechIndex(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setActiveSpeechIndex(null);
      utterance.onerror = () => setActiveSpeechIndex(null);
      setActiveSpeechIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(comic, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Container matching screenshot on page 22-23 */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Create Another Comic
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJson(!showJson)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" />
              {showJson ? 'Hide API JSON' : 'View API Data'}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Compiling PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Your Comic as PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* JSON Inspector if toggled */}
        {showJson && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-lg border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <span className="font-semibold text-blue-400">ComicCraft API Payload (/generate-comic/json)</span>
              <button
                onClick={copyJson}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
            <pre className="overflow-x-auto max-h-72 text-[11px] leading-relaxed">
              {JSON.stringify(comic, null, 2)}
            </pre>
          </div>
        )}

        {/* Top Header Card matching page 22: "📖 Your Comic Preview" */}
        <div className="bg-white rounded-t-xl border border-b-0 border-slate-300 shadow-xs px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Comic Preview</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Style: {comic.request.style}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Tone: {comic.request.tone}
            </span>
          </div>
        </div>

        {/* Comic Story Title Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 rounded-b-xl shadow-md border-t-0 border border-slate-300">
          <div className="text-xs font-semibold text-blue-200 tracking-wider uppercase mb-1">
            ComicCraft Illustrated Edition
          </div>
          <h1 className="text-2xl font-black tracking-tight">{comic.title || comic.request.prompt}</h1>
          <p className="text-xs text-blue-100 mt-1">
            Featuring <strong>{comic.request.character_name}</strong> in the {comic.request.setting} • 5 Panels
          </p>
        </div>

        {/* Sequential Panel List matching pages 22 & 23 */}
        <div className="space-y-8">
          {comic.layout.map((panel: PanelLayoutItem, idx: number) => {
            const isSpeaking = activeSpeechIndex === idx;
            const fullSpeechText = `${panel.title}. ${panel.scene_description}. Caption: ${panel.caption}. Narration: ${panel.narration}.`;

            return (
              <div
                key={panel.panel}
                className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Panel Title Bar (e.g. "Panel 1: The Forest's Edge") */}
                <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
                  <h3 className="font-bold text-base sm:text-lg tracking-wide flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Panel {panel.panel}: {panel.title.replace(/^Panel\s+\d+:?\s*/i, '')}
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReadAloud(fullSpeechText, idx)}
                      title="Read panel narration aloud"
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        isSpeaking
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isSpeaking ? 'Mute' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={() => setZoomImage(panel.image_path)}
                      title="Full view illustration"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Panel Body Content */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Central Comic Image */}
                  <div className="relative group rounded-xl overflow-hidden border-2 border-slate-900 bg-slate-950 shadow-inner">
                    <img
                      src={panel.image_path}
                      alt={`Panel ${panel.panel} Illustration: ${panel.title}`}
                      className="w-full h-auto max-h-[460px] object-cover mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 backdrop-blur-xs text-white text-[11px] px-2 py-1 rounded">
                      Art Style: {comic.request.style}
                    </div>
                  </div>

                  {/* Scene Description (Displayed in italics matching spec) */}
                  <div className="text-slate-600 italic text-sm sm:text-base leading-relaxed border-l-4 border-blue-400 pl-3.5 py-0.5">
                    {panel.scene_description}
                  </div>

                  {/* Captions and Narration Section */}
                  <div className="space-y-2.5 pt-1">
                    {/* CAPTION (Ambient description) */}
                    {panel.caption && (
                      <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 text-xs sm:text-sm text-amber-950 font-serif shadow-2xs">
                        <strong className="text-amber-800 font-sans tracking-wider text-[11px] uppercase mr-2 bg-amber-200/70 px-1.5 py-0.5 rounded font-bold">
                          **CAPTION**
                        </strong>
                        <span className="italic">{panel.caption}</span>
                      </div>
                    )}

                    {/* NARRATION (Main character's actions or dialogue) */}
                    {panel.narration && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs">
                        <strong className="text-slate-700 tracking-wider text-[11px] uppercase mr-2 bg-slate-200 px-1.5 py-0.5 rounded font-bold">
                          **NARRATION**
                        </strong>
                        <span>{panel.narration}</span>
                      </div>
                    )}

                    {/* DIALOGUES if present */}
                    {panel.dialogues && panel.dialogues.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {panel.dialogues.map((diag, dIdx) => (
                          <div
                            key={dIdx}
                            className="bg-blue-50/70 border border-blue-200/70 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-blue-950 font-medium flex items-start gap-2"
                          >
                            <span className="text-blue-600 mt-0.5 text-base">💬</span>
                            <span>{diag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Prompt Reference Box (matching page 23 spec) */}
                  <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono bg-slate-50/70 rounded-lg p-2.5">
                    <strong className="text-slate-700 font-sans uppercase font-bold mr-1">
                      **IMAGE PROMPT**
                    </strong>
                    <span className="break-words">{panel.image_prompt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Download Button Section matching page 24 */}
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 sm:p-8 text-center shadow-lg space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
            <Download className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Ready to save your comic?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Download the complete 5-panel comic with full-color illustrations, narration, and formatted story pages in PDF format.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="w-full sm:w-auto min-w-[280px] py-3.5 px-8 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all text-base cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Compiling PDF File...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Your Comic as PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <img
              src={zoomImage}
              alt="Zoomed comic panel illustration"
              className="max-h-[85vh] max-w-full object-contain rounded-lg border-2 border-white/20 shadow-2xl"
            />
            <p className="text-xs text-slate-400 mt-2">Click anywhere to close full preview</p>
          </div>
        </div>
      )}
    </div>
  );
};
