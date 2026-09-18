import React, { useState } from 'react';
import { OptimizeRequest } from '../types';
import { X, Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRequest: OptimizeRequest;
  onImport: (imported: OptimizeRequest) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  currentRequest,
  onImport,
}) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(currentRequest, null, 2));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(currentRequest, null, 2));
      setErrorMsg(null);
      setCopied(false);
    }
  }, [isOpen, currentRequest]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRequest.scenario_id || 'scenario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      // Validate schema
      if (!parsed.scenario_id || typeof parsed.scenario_id !== 'string') {
        throw new Error("Missing or invalid 'scenario_id' (string).");
      }
      if (!Array.isArray(parsed.operator_notes)) {
        throw new Error("Missing or invalid 'operator_notes' (array).");
      }
      if (!Array.isArray(parsed.hours) || parsed.hours.length !== 24) {
        throw new Error("'hours' must be an array of exactly 24 hour objects.");
      }
      if (!parsed.battery || typeof parsed.battery !== 'object') {
        throw new Error("Missing 'battery' configuration object.");
      }

      onImport(parsed);
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Invalid JSON format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scenario JSON Import / Export
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Matches FastAPI backend `POST /optimize-energy` payload schema.
            </p>
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
        <div className="p-4 flex-1 overflow-hidden flex flex-col space-y-3">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setErrorMsg(null);
            }}
            className="w-full flex-1 min-h-[300px] p-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .json</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Apply to Scenario</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
