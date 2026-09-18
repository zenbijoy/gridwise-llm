import React from 'react';
import { Zap, Moon, Sun, Play, Server, Menu, X, RefreshCw } from 'lucide-react';
import { HealthState, ScenarioPreset } from '../types';

interface HeaderProps {
  presets: ScenarioPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  healthStatus: HealthState;
  onRefreshHealth: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  selectedPresetId,
  onSelectPreset,
  healthStatus,
  onRefreshHealth,
  theme,
  onToggleTheme,
  onOptimize,
  isOptimizing,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">GridWise</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80 rounded">
                  LLM + LP
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium leading-none">
                Smart Campus Microgrid Optimizer
              </p>
            </div>
          </div>
        </div>

        {/* Center: Scenario Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <label htmlFor="preset-select" className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Scenario Preset:
          </label>
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="custom">Custom Scenario</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Health badge + Theme toggle + Optimize Button */}
        <div className="flex items-center gap-2.5">
          {/* Connection status badge */}
          <button
            type="button"
            onClick={onRefreshHealth}
            title="Click to re-check API health status"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
            <span className="hidden sm:inline">
              {healthStatus === 'online' ? 'API Online' : healthStatus === 'checking' ? 'Connecting...' : 'API Offline'}
            </span>
            <Server className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Primary CTA button */}
          <button
            type="button"
            onClick={onOptimize}
            disabled={isOptimizing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all shadow-sm ${
              isOptimizing
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 hover:shadow-emerald-600/40 active:scale-98'
            }`}
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Optimize Energy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
