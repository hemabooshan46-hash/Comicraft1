/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PromptRequest, ComicStoryResult } from './types/comic';
import { ComicForm } from './components/ComicForm';
import { ComicPreview } from './components/ComicPreview';
import { ExportSuccess } from './components/ExportSuccess';
import { ApiDocumentation } from './components/ApiDocumentation';
import { TestImageViewer } from './components/TestImageViewer';
import {
  Wand2,
  BookOpen,
  Image as ImageIcon,
  Code2,
  Sparkles,
  Layers,
  Heart,
} from 'lucide-react';

type AppView = 'home' | 'preview' | 'export_success' | 'api_docs' | 'test_image';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeComic, setActiveComic] = useState<ComicStoryResult | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [stepNumber, setStepNumber] = useState(1);
  const [currentStepMessage, setCurrentStepMessage] = useState('');

  // Check URL params on mount (e.g. ?view=preview&id=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as AppView;
    const idParam = params.get('id');

    if (viewParam && ['home', 'preview', 'export_success', 'api_docs', 'test_image'].includes(viewParam)) {
      setCurrentView(viewParam);
    }

    if (idParam) {
      fetch(`/api/comics/${idParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.layout) {
            setActiveComic(data);
            setCurrentView('preview');
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleGenerateComic = async (requestData: PromptRequest) => {
    setIsLoading(true);
    setStepNumber(1);
    setCurrentStepMessage('Gemini Flash: Structuring 5-panel storyline...');

    // Progress updates to give realistic user feedback through the pipeline
    const timer1 = setTimeout(() => {
      setStepNumber(2);
      setCurrentStepMessage('Gemini Pro: Composing full character dialogue and narration...');
    }, 1800);

    const timer2 = setTimeout(() => {
      setStepNumber(3);
      setCurrentStepMessage('Comic Engine: Generating visual illustrations for each panel...');
    }, 3800);

    const timer3 = setTimeout(() => {
      setStepNumber(4);
      setCurrentStepMessage('Layout Builder: Matching panel graphics, dialogue, and scene layout...');
    }, 6000);

    const timer4 = setTimeout(() => {
      setStepNumber(5);
      setCurrentStepMessage('Exporters: Preparing comic preview & PDF bundle...');
    }, 7800);

    try {
      const response = await fetch('/generate-comic/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Generation failed with status ${response.status}`);
      }

      const data = await response.json();

      const comicResult: ComicStoryResult = {
        id: data.id || `comic_${Date.now()}`,
        timestamp: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
        title: data.outline?.[0]?.title?.replace(/^Panel\s+\d+:?\s*/i, '') || requestData.prompt.slice(0, 30),
        request: requestData,
        outline: data.outline || [],
        full_story: data.full_story || '',
        layout: data.layout || [],
        pdf_path: data.pdf_path,
      };

      setActiveComic(comicResult);
      setCurrentView('preview');
    } catch (error: any) {
      console.error('Error during comic creation:', error);
      alert('Unable to generate comic. Please check your prompt and try again.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setIsLoading(false);
    }
  };

  const handleExportSuccess = (filename: string) => {
    setExportedFilename(filename);
    setCurrentView('export_success');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Comic<span className="text-blue-600">Craft</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Gemini AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden md:block">
                AI Comic Story Creator with Gemini & Diffusion
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'home'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">Create Comic</span>
            </button>

            {activeComic && (
              <button
                onClick={() => setCurrentView('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}

            <button
              onClick={() => setCurrentView('test_image')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'test_image'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden md:inline">Image Tester</span>
            </button>

            <button
              onClick={() => setCurrentView('api_docs')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentView === 'api_docs'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden md:inline">API Docs (/docs)</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page View Switching */}
      <main className="flex-1">
        {currentView === 'home' && (
          <ComicForm
            onGenerate={handleGenerateComic}
            isLoading={isLoading}
            currentStepMessage={currentStepMessage}
            stepNumber={stepNumber}
          />
        )}

        {currentView === 'preview' && activeComic && (
          <ComicPreview
            comic={activeComic}
            onBackToHome={() => setCurrentView('home')}
            onExportSuccess={handleExportSuccess}
          />
        )}

        {currentView === 'export_success' && activeComic && (
          <ExportSuccess
            comic={activeComic}
            filename={exportedFilename}
            onGoHome={() => setCurrentView('home')}
            onReviewComic={() => setCurrentView('preview')}
          />
        )}

        {currentView === 'test_image' && (
          <TestImageViewer onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'api_docs' && (
          <ApiDocumentation onBack={() => setCurrentView('home')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">ComicCraft</span>
            <span>• SmartBridge / SmartInternz Architecture</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Powered by Gemini 3.8 Flash & Diffusion AI</span>
            <span>•</span>
            <span>5-Panel Storytelling Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
