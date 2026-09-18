import React from 'react';
import { OptimizationHistoryItem } from '../types';
import { X, History, Trash2, ArrowRight, DollarSign, Zap } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: OptimizationHistoryItem[];
  onSelectHistory: (item: OptimizationHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistory,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Optimization History</h2>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {history.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <History className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p>No past optimization runs recorded yet.</p>
                <p className="text-[11px]">Each optimization you run will be saved in your browser storage.</p>
              </div>
            ) : (
              history.map((item) => {
                const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.scenario_id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <DollarSign className="w-3 h-3 text-amber-500" />
                        <span>৳{item.total_cost_bdt.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Zap className="w-3 h-3 text-blue-500" />
                        <span>{item.total_grid_kwh.toFixed(1)} kWh</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectHistory(item);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors"
                    >
                      <span>Load Schedule</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
