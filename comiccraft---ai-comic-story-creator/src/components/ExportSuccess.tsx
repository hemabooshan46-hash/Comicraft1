import React from 'react';
import { ComicStoryResult } from '../types/comic';
import { exportComicToPdf } from '../services/pdfExporter';
import { CheckCircle2, Wand2, Download, Eye, Sparkles, FileText, ArrowRight } from 'lucide-react';

interface ExportSuccessProps {
  comic: ComicStoryResult;
  filename: string;
  onGoHome: () => void;
  onReviewComic: () => void;
}

export const ExportSuccess: React.FC<ExportSuccessProps> = ({
  comic,
  filename,
  onGoHome,
  onReviewComic,
}) => {
  const handleDownloadAgain = async () => {
    await exportComicToPdf(comic);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-100">
      {/* Scenic Background with subtle overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=80')`,
        }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-6">
          {/* Green checkmark circle matching page 24 */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full shadow-inner mx-auto border-4 border-emerald-100 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          {/* Heading matching page 24 exactly */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              Comic Exported Successfully!
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your AI-powered comic has been successfully created! Dive back in and bring another story to life.
            </p>
          </div>

          {/* Comic File Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {comic.title || comic.request.prompt}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                {filename || `comic_${comic.timestamp}.pdf`} • 5 Pages
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Primary Blue Button matching page 24: "Go Create Another Comic" */}
            <button
              onClick={onGoHome}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all text-base cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Wand2 className="w-5 h-5" />
              Go Create Another Comic
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onReviewComic}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                Review Comic
              </button>

              <button
                onClick={handleDownloadAgain}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Download Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
