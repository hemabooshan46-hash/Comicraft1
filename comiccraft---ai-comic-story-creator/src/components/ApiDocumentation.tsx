import React, { useState } from 'react';
import { PromptRequest } from '../types/comic';
import {
  Code2,
  Send,
  ArrowLeft,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Terminal,
  Layers,
} from 'lucide-react';

interface ApiDocumentationProps {
  onBack: () => void;
  onSelectComic?: (comic: any) => void;
}

export const ApiDocumentation: React.FC<ApiDocumentationProps> = ({ onBack, onSelectComic }) => {
  const [activeTab, setActiveTab] = useState<'generate-json' | 'generate-form' | 'test-image'>(
    'generate-json'
  );
  const [requestJson, setRequestJson] = useState(
    JSON.stringify(
      {
        prompt: 'A brave fox exploring an enchanted forest, discovering glowing ancient shrines.',
        character_name: 'Free',
        setting: 'forest',
        tone: 'dramatic',
        style: 'anime',
      },
      null,
      2
    )
  );

  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    setResponseOutput(null);
    setStatusCode(null);

    try {
      if (activeTab === 'generate-json') {
        const payload = JSON.parse(requestJson);
        const res = await fetch('/generate-comic/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setStatusCode(res.status);
        const data = await res.json();
        setResponseOutput(JSON.stringify(data, null, 2));
      } else if (activeTab === 'test-image') {
        const res = await fetch('/test-image?prompt=A+futuristic+cyberpunk+city+at+sunset&style=comic+book');
        setStatusCode(res.status);
        const data = await res.json();
        setResponseOutput(JSON.stringify(data, null, 2));
      } else {
        const formData = new URLSearchParams();
        formData.append('prompt', 'A funny robot going to high school');
        formData.append('character_name', 'Gizmo');
        formData.append('setting', 'school');
        formData.append('tone', 'funny');
        formData.append('style', 'comic book');

        const res = await fetch('/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formData.toString(),
        });
        setStatusCode(res.status);
        const data = await res.json();
        setResponseOutput(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setStatusCode(500);
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = () => {
    if (!responseOutput) return;
    navigator.clipboard.writeText(responseOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-700 px-3 py-1 rounded-full font-mono">
              FastAPI /docs Specification Mode
            </span>
          </div>
        </div>

        {/* Documentation Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                ComicCraft API Interactive Console
                <span className="text-xs bg-blue-600 text-white font-mono px-2 py-0.5 rounded">v1.0.0</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Explore and execute endpoints defined in <code>routes.py</code> and Activity 2.2.
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('generate-json')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'generate-json'
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                POST
              </span>
              <span className="text-xs font-mono text-blue-300">/generate-comic/json</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">JSON Payload Generation</div>
          </button>

          <button
            onClick={() => setActiveTab('generate-form')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'generate-form'
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                POST
              </span>
              <span className="text-xs font-mono text-blue-300">/generate</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Form & Request Handlers</div>
          </button>

          <button
            onClick={() => setActiveTab('test-image')}
            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
              activeTab === 'test-image'
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                GET
              </span>
              <span className="text-xs font-mono text-blue-300">/test-image</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Image Testing Endpoint</div>
          </button>
        </div>

        {/* Selected Endpoint Explorer */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold mr-2">
                {activeTab === 'test-image' ? 'GET' : 'POST'}
              </span>
              <span className="text-sm font-mono text-white">
                {activeTab === 'generate-json'
                  ? '/generate-comic/json'
                  : activeTab === 'generate-form'
                  ? '/generate'
                  : '/test-image?prompt=...&style=...'}
              </span>
            </div>

            <button
              onClick={handleExecute}
              disabled={loading}
              className="py-2 px-5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Executing...' : 'Try It Out (Execute)'}
            </button>
          </div>

          {activeTab === 'generate-json' && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                Request Body (PromptRequest Schema):
              </label>
              <textarea
                rows={9}
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 border border-slate-700 rounded-xl text-emerald-300 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          )}

          {activeTab === 'generate-form' && (
            <div className="text-xs text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 font-mono">
              <p className="text-blue-300 font-bold">Content-Type: application/x-www-form-urlencoded</p>
              <p>• prompt: "A funny robot going to high school"</p>
              <p>• character_name: "Gizmo"</p>
              <p>• setting: "school"</p>
              <p>• tone: "funny"</p>
              <p>• style: "comic book"</p>
            </div>
          )}

          {activeTab === 'test-image' && (
            <div className="text-xs text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 font-mono">
              <p className="text-blue-300 font-bold">Query Parameters:</p>
              <p>• prompt: "A futuristic cyberpunk city at sunset"</p>
              <p>• style: "comic book"</p>
            </div>
          )}

          {/* Response Console */}
          {responseOutput && (
            <div className="pt-3 border-t border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Response</span>
                  {statusCode && (
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                        statusCode === 200
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-rose-950 text-rose-400 border border-rose-700'
                      }`}
                    >
                      Status {statusCode} OK
                    </span>
                  )}
                </div>

                <button
                  onClick={copyOutput}
                  className="text-xs inline-flex items-center gap-1 text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Response'}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-700 font-mono text-xs text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                {responseOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
