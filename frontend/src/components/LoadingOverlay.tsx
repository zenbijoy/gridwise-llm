import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, Cpu, ShieldCheck, CheckCircle } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isOpen }) => {
  const stages = [
    { label: 'Validating scenario configuration...', icon: ShieldCheck },
    { label: 'Dispatching operator notes to Gemini LLM...', icon: Sparkles },
    { label: 'Applying deterministic guardrails & sanitization...', icon: ShieldCheck },
    { label: 'Compiling 24-hour mathematical constraint vectors...', icon: Cpu },
    { label: 'Executing PuLP + CBC linear programming solver...', icon: Cpu },
    { label: 'Performing independent mathematical replay audit...', icon: CheckCircle },
  ];

  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIdx(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev + 1) % stages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isOpen, stages.length]);

  if (!isOpen) return null;

  const currentStage = stages[currentStageIdx];
  const StageIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-center">
        {/* Animated Icon Ring */}
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <StageIcon className="w-5 h-5 transition-all duration-300" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Optimizing Campus Microgrid
          </h3>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono min-h-[1.5rem] transition-all">
            {currentStage.label}
          </p>
        </div>

        {/* Indeterminate pulsing progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-1/3 rounded-full animate-pulse" />
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
          Running real-time Gemini LLM directive interpretation and PuLP + COIN-OR CBC linear programming. Please wait.
        </div>
      </div>
    </div>
  );
};
