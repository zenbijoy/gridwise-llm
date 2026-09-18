import React from 'react';
import {
  Zap,
  Moon,
  Sun,
  Play,
  Server,
  Menu,
  X,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { HealthState, ScenarioPreset } from '../types';
import { Language, translations } from '../utils/i18n';
import { RealTimeTimer } from './RealTimeTimer';

interface HeaderProps {
  presets: ScenarioPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  healthStatus: HealthState;
  onRefreshHealth: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  solveDurationMs?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  healthStatus,
  onRefreshHealth,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  onOptimize,
  isOptimizing,
  mobileMenuOpen,
  onToggleMobileMenu,
  solveDurationMs,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  {t.brandTitle}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 rounded">
                  LLM + LP
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {t.brandSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Real-Time Timer & Live Clock */}
        <div className="flex items-center">
          <RealTimeTimer
            isOptimizing={isOptimizing}
            solveDurationMs={solveDurationMs}
            language={language}
          />
        </div>

        {/* Right: Preset Selector + Language Toggle + Server Health + Theme + Primary CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Preset Selector Dropdown */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="custom">{t.customScenario}</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title={language === 'en' ? 'বাংলা ভাষায় দেখুন' : 'Switch to English'}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 transition-all hover:scale-105 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Connection status badge */}
          <button
            type="button"
            onClick={onRefreshHealth}
            title="Click to re-check API health"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'online'
                  ? 'bg-emerald-500 animate-pulse'
                  : healthStatus === 'checking'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden xl:inline">
              {healthStatus === 'online'
                ? t.apiOnline
                : healthStatus === 'checking'
                ? t.apiConnecting
                : t.apiOffline}
            </span>
            <Server className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform active:rotate-45 focus:outline-none"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Primary CTA button */}
          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shadow-md active:scale-95 ${
              isOptimizing
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
            }`}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t.optimizing}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.optimizeEnergy}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
