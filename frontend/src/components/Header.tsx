import React, { useEffect, useState } from 'react';
import {
  Zap,
  Moon,
  Sun,
  Play,
  Server,
  Globe,
  LayoutDashboard,
  Cpu,
  BarChart3,
  Sliders,
  FileCheck2,
  Menu,
  X,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { HealthState, ScenarioPreset } from '../types';
import { Language, translations } from '../utils/i18n';
import { RealTimeTimer } from './RealTimeTimer';
import { NotificationsPopover } from './NotificationsPopover';
import { NavSection } from './Sidebar';

export type TopNavItem = 'dashboard' | 'operations' | 'analytics' | 'optimization' | 'reports';

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
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
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
  activeSection,
  onSelectSection,
}) => {
  const t = translations[language];
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Map top nav items to existing section navigation
  const topNavLinks: {
    id: TopNavItem;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    targetSection: NavSection;
    isAction?: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: t.navTopDashboard,
      icon: LayoutDashboard,
      targetSection: 'dashboard',
    },
    {
      id: 'operations',
      label: t.navTopOperations,
      icon: Sliders,
      targetSection: 'scenario',
    },
    {
      id: 'analytics',
      label: t.navTopAnalytics,
      icon: BarChart3,
      targetSection: 'charts',
    },
    {
      id: 'optimization',
      label: t.navTopOptimization,
      icon: Cpu,
      targetSection: 'results',
    },
    {
      id: 'reports',
      label: t.navTopReports,
      icon: FileCheck2,
      targetSection: 'directives',
    },
  ];

  // Helper to determine if top link is active
  const isTopActive = (item: typeof topNavLinks[0]) => {
    if (item.id === 'dashboard') return activeSection === 'dashboard';
    if (item.id === 'operations') return activeSection === 'scenario' || activeSection === 'matrix' || activeSection === 'battery';
    if (item.id === 'analytics') return activeSection === 'charts';
    if (item.id === 'optimization') return activeSection === 'results';
    if (item.id === 'reports') return activeSection === 'directives' || activeSection === 'docs' || activeSection === 'history';
    return false;
  };

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? 'py-1.5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/20'
          : 'py-2.5 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-3">
          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Green Energy Logo with animated energy pulse */}
          <div
            onClick={() => onSelectSection('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center">
              {/* Outer animated energy pulse ring */}
              <div className="absolute -inset-1 rounded-2xl bg-emerald-500/25 dark:bg-emerald-400/20 blur-sm animate-pulse-glow" />
              {/* Inner Logo Icon */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 dark:from-white dark:via-slate-100 dark:to-emerald-300 bg-clip-text text-transparent">
                  {t.brandTitle}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
                  LP + AI
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                {t.brandSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* ================= CENTER ================= */}
        {/* Navigation Items with green accent & soft indicator */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-inner">
          {topNavLinks.map((item) => {
            const Icon = item.icon;
            const active = isTopActive(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.targetSection)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'opacity-70'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full animate-in fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Preset Selector Dropdown */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-slate-100/70 dark:bg-slate-900/70 px-2.5 py-1 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
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

          {/* Live system status indicator with pulsing dot */}
          <button
            type="button"
            onClick={onRefreshHealth}
            title={healthStatus === 'online' ? 'API Online — Click to re-check' : 'Click to reconnect'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'online'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                  : healthStatus === 'checking'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden xl:inline text-slate-700 dark:text-slate-300 text-[11px]">
              {healthStatus === 'online' ? t.apiOnline : healthStatus === 'checking' ? t.apiConnecting : t.apiOffline}
            </span>
          </button>

          {/* Current Time (BST Live Timer) */}
          <div className="hidden sm:flex items-center">
            <RealTimeTimer
              isOptimizing={isOptimizing}
              solveDurationMs={solveDurationMs}
              language={language}
            />
          </div>

          {/* Language Selector (BN ⇄ EN) */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title={language === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-400 transition-all hover:scale-105 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Notifications icon with badge */}
          <NotificationsPopover language={language} />

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-transform active:rotate-45 focus:outline-none"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User/Operator Profile Menu Badge */}
          <div className="hidden lg:flex items-center gap-1.5 pl-1.5 border-l border-slate-200/80 dark:border-slate-800">
            <div
              title="SCADA Grid Operator (BUP Microgrid Admin)"
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">
                OP
              </div>
              <span className="text-[11px] font-medium hidden xl:inline">Operator</span>
            </div>
          </div>

          {/* Primary CTA Button: "অপ্টিমাইজ করুন" / "Optimize" */}
          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all shadow-md active:scale-95 ${
              isOptimizing
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
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
