import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, CheckCircle2, Activity } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { OptimizeResponse } from '../types';

interface HeroSectionProps {
  language: Language;
  response: OptimizeResponse | null;
  onRefresh: () => void;
  isOptimizing: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  response,
  onRefresh,
  isOptimizing,
}) => {
  const t = translations[language];
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting(`${t.heroGreetingMorning} 👋`);
      } else if (hours >= 12 && hours < 17) {
        setGreeting(`${t.heroGreetingAfternoon} 👋`);
      } else if (hours >= 17 && hours < 21) {
        setGreeting(`${t.heroGreetingEvening} 👋`);
      } else {
        setGreeting(`${t.heroGreetingNight} 👋`);
      }

      setLastUpdated(
        now.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(interval);
  }, [language, t]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/20 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
      {/* Subtle Energy Grid & Particle Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Dynamic Greeting + Titles */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>{greeting}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {t.heroTitle}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Right: Telemetry status + Last Updated + Refresh CTA */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end lg:items-center gap-3">
          {/* System Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono leading-none">
                {t.systemStatusLabel}
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {response ? (language === 'bn' ? 'অপ্টিমাইজড' : 'Optimal Plan Active') : (language === 'bn' ? 'স্ট্যান্ডবাই' : 'Telemetry Live')}
              </div>
            </div>
          </div>

          {/* Last updated badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono leading-none">
                {t.lastUpdatedLabel}
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {lastUpdated || '12:00:00 AM'}
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            title={t.refreshTooltip}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-all active:scale-95 group"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-500 ${
                isOptimizing ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
