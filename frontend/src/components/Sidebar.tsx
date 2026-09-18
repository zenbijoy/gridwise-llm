import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Table,
  BatteryCharging,
  Sparkles,
  CheckCircle2,
  LineChart,
  History,
  Code2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';

export type NavSection =
  | 'dashboard'
  | 'scenario'
  | 'matrix'
  | 'battery'
  | 'directives'
  | 'results'
  | 'charts'
  | 'history'
  | 'docs';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  hasResults: boolean;
  directiveCount: number;
  language?: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpen,
  onCloseMobile,
  hasResults,
  directiveCount,
  language = 'en',
}) => {
  const t = translations[language];
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'scenario', label: t.navScenario, icon: FileText },
    { id: 'matrix', label: t.navMatrix, icon: Table },
    { id: 'battery', label: t.navBattery, icon: BatteryCharging },
    {
      id: 'directives',
      label: t.navDirectives,
      icon: Sparkles,
      badge: hasResults ? directiveCount : undefined,
    },
    {
      id: 'results',
      label: t.navResults,
      icon: CheckCircle2,
      badge: hasResults ? (language === 'bn' ? 'যাচাইকৃত' : 'Verified') : undefined,
    },
    { id: 'charts', label: t.navCharts, icon: LineChart },
    { id: 'history', label: t.navHistory, icon: History },
    { id: 'docs', label: t.navDocs, icon: Code2 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-20 h-[calc(100vh-4rem)] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out flex flex-col justify-between select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="p-3 space-y-3">
          {/* Header row with Section title & Collapse Button */}
          <div className="flex items-center justify-between px-2 pt-2">
            {!isCollapsed && (
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                {t.systemArchitecture}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors mx-auto"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                    } rounded-2xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                          isActive
                            ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Compact SCADA Status Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          {!isCollapsed ? (
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-900/40 p-3.5 space-y-2 border border-slate-200/80 dark:border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Optimizer:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PuLP + CBC
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">LLM Engine:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Gemini / Router
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Audit Mode:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Fail-Closed
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Optimizer Ready" />
              <span className="w-2 h-2 rounded-full bg-blue-500" title="LLM Ready" />
              <span className="w-2 h-2 rounded-full bg-teal-500" title="Audit Active" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
