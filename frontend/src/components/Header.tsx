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
  LayoutDashboard,
  FileText,
  Table,
  BatteryCharging,
  Sparkles,
  CheckCircle2,
  LineChart,
  History,
  Code2,
} from 'lucide-react';
import { HealthState, ScenarioPreset } from '../types';
import { Language, translations } from '../utils/i18n';
import { NavSection } from './Sidebar';

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
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  hasResults: boolean;
  directiveCount: number;
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
  activeSection,
  onSelectSection,
  onOptimize,
  isOptimizing,
  mobileMenuOpen,
  onToggleMobileMenu,
  hasResults,
  directiveCount,
}) => {
  const t = translations[language];

  const navTabs: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'scenario', label: t.navScenario, icon: FileText },
    { id: 'matrix', label: t.navMatrix, icon: Table },
    { id: 'battery', label: t.navBattery, icon: BatteryCharging },
    { id: 'directives', label: t.navDirectives, icon: Sparkles, badge: hasResults ? directiveCount : undefined },
    { id: 'results', label: t.navResults, icon: CheckCircle2, badge: hasResults ? '✓' : undefined },
    { id: 'charts', label: t.navCharts, icon: LineChart },
    { id: 'history', label: t.navHistory, icon: History },
    { id: 'docs', label: t.navDocs, icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile menu toggle + Brand Logo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => onSelectSection('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  {t.brandTitle}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 rounded">
                  LLM + LP
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {t.brandSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Scenario Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <label htmlFor="preset-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {t.scenarioPreset}:
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="custom">{t.customScenario}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Controls: Language + Health + Theme + Primary CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title={language === 'en' ? 'বাংলা ভাষায় দেখুন' : 'Switch to English'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 transition-all hover:scale-105 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Connection status badge */}
          <button
            type="button"
            onClick={onRefreshHealth}
            title="Click to re-check API status"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <span className="hidden md:inline">
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
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-xs tracking-wider transition-all shadow-md active:scale-95 ${
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

      {/* Horizontal Nav Bar Tabs (Sticky & Scrollable on Mobile) */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none text-xs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectSection(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
