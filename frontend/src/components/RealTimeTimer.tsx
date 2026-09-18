import React, { useState, useEffect } from 'react';
import { Clock, Timer, Zap } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface RealTimeTimerProps {
  isOptimizing: boolean;
  solveDurationMs?: number | null;
  language: Language;
}

export const RealTimeTimer: React.FC<RealTimeTimerProps> = ({
  isOptimizing,
  solveDurationMs,
  language,
}) => {
  const t = translations[language];
  const [time, setTime] = useState<Date>(new Date());
  const [stopwatchMs, setStopwatchMs] = useState<number>(0);

  // Live real-time clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time stopwatch during active optimization
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isOptimizing) {
      const startTime = Date.now();
      setStopwatchMs(0);
      interval = setInterval(() => {
        setStopwatchMs(Date.now() - startTime);
      }, 50);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOptimizing]);

  const currentHour = time.getHours();
  // Bangladesh typical peak hours: 17:00 to 22:59
  const isPeakHour = currentHour >= 17 && currentHour <= 22;

  // Format numbers to Bengali numerals if language is 'bn'
  const toDigits = (num: number | string): string => {
    if (language !== 'bn') return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num
      .toString()
      .split('')
      .map((c) => (c >= '0' && c <= '9' ? bnDigits[parseInt(c, 10)] : c))
      .join('');
  };

  const hoursStr = time.getHours().toString().padStart(2, '0');
  const minutesStr = time.getMinutes().toString().padStart(2, '0');
  const secondsStr = time.getSeconds().toString().padStart(2, '0');

  const formattedTime = `${toDigits(hoursStr)}:${toDigits(minutesStr)}:${toDigits(secondsStr)}`;

  return (
    <div className="flex items-center gap-2 sm:gap-3 text-xs">
      {/* Live System Clock */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-sm font-mono">
        <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        <span className="font-bold tracking-wider">{formattedTime}</span>
        <span className="text-[10px] text-slate-400 font-semibold">BST</span>
      </div>

      {/* Current Operational Hour & Peak/Off-Peak Indicator */}
      <div
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
          isPeakHour
            ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}
        title={isPeakHour ? t.peakHour : t.offPeakHour}
      >
        <Zap className="w-3 h-3 fill-current" />
        <span>
          {language === 'bn' ? `ঘণ্টা ${toDigits(hoursStr)}:০০` : `Hour ${hoursStr}:00`}
        </span>
        <span className="text-[10px] opacity-80">
          • {isPeakHour ? t.peakHour : t.offPeakHour}
        </span>
      </div>

      {/* Stopwatch / Elapsed Solving Timer */}
      {isOptimizing ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-mono font-bold animate-pulse shadow-sm">
          <Timer className="w-3.5 h-3.5 animate-spin" />
          <span>{(stopwatchMs / 1000).toFixed(1)}s</span>
        </div>
      ) : solveDurationMs ? (
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <Timer className="w-3 h-3 text-emerald-500" />
          <span>{(solveDurationMs / 1000).toFixed(2)}s</span>
        </div>
      ) : null}
    </div>
  );
};
