import React, { useEffect, useState } from 'react';
import {
  Zap,
  Play,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { OptimizeResponse } from '../types';

interface OptimizationActionCardProps {
  language: Language;
  onOptimize: () => void;
  isOptimizing: boolean;
  response: OptimizeResponse | null;
  solveDurationMs?: number | null;
}

export const OptimizationActionCard: React.FC<OptimizationActionCardProps> = ({
  language,
  onOptimize,
  isOptimizing,
  response,
  solveDurationMs,
}) => {
  const t = translations[language];
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);

  const steps = [
    t.stepAnalyzingDemand,
    t.stepForecastingSolar,
    t.stepOptimizingBattery,
    t.stepCalculatingGrid,
    t.stepGeneratingSchedule,
    t.stepOptimizationComplete,
  ];

  useEffect(() => {
    if (isOptimizing) {
      setCurrentStepIdx(0);
      const interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < steps.length - 2) return prev + 1;
          return prev;
        });
      }, 400);
      return () => clearInterval(interval);
    } else if (response) {
      setCurrentStepIdx(steps.length - 1);
    } else {
      setCurrentStepIdx(-1);
    }
  }, [isOptimizing, response, steps.length]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-6">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Prominent Headline & Subtitle */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold tracking-wide border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span>PuLP + COIN-OR CBC LP SOLVER</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {t.readyToOptimizeTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            {t.readyToOptimizeDesc}
          </p>
        </div>

        {/* Right: Primary Call to Action Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wider transition-all duration-200 shadow-lg active:scale-95 ${
              isOptimizing
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5'
            }`}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.optimizing}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.runOptimizationBtn}</span>
              </>
            )}
          </button>

          {solveDurationMs !== null && solveDurationMs !== undefined && response && (
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>{solveDurationMs} ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Optimization Process Timeline */}
      <div className="relative z-10 border-t border-slate-800/80 pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = isOptimizing && currentStepIdx === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-1.5 ${
                  isCurrent
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20 scale-102'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold opacity-70">
                    0{idx + 1}
                  </span>
                  {isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className="text-[11px] font-semibold leading-tight line-clamp-2">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
