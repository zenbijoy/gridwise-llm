import React from 'react';
import { X, ExternalLink, Code2, ShieldCheck } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const baseOrigin = window.location.origin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              FastAPI Endpoints & Documentation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* External Swagger & ReDoc Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`${baseOrigin}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Interactive Swagger UI</div>
                <div className="text-[11px] text-slate-400 font-mono">/docs</div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-500" />
            </a>

            <a
              href={`${baseOrigin}/redoc`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">ReDoc Specification</div>
                <div className="text-[11px] text-slate-400 font-mono">/redoc</div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-500" />
            </a>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider text-[11px]">
              Available Endpoints
            </h4>

            {/* GET /health */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                  GET
                </span>
                <span className="font-bold text-slate-900 dark:text-white">/health</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Instant liveness probe. Returns <code className="font-mono text-emerald-600 dark:text-emerald-400">{'{"status": "ok"}'}</code> without invoking LLM or solver.
              </p>
            </div>

            {/* GET /ready */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                  GET
                </span>
                <span className="font-bold text-slate-900 dark:text-white">/ready</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Readiness check verifying backend environment and COIN-OR CBC linear programming solver availability.
              </p>
            </div>

            {/* POST /optimize-energy */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                  POST
                </span>
                <span className="font-bold text-slate-900 dark:text-white">/optimize-energy</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Main 13-stage optimization pipeline: Operator Notes → Gemini LLM → Guardrails → Directive Compiler → PuLP CBC Solver → Independent Replay Audit → HTTP 200 JSON.
              </p>
              <div className="text-[10px] text-slate-400 font-mono">
                Rate limited: 60 req/min · Body limit: 1 MB · Request correlation: X-Request-ID
              </div>
            </div>
          </div>

          {/* Security Guarantee */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">Security & Privacy:</span> Frontend communicates strictly with the FastAPI server. API keys and LLM tokens are never returned in responses or exposed to browser JavaScript.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
