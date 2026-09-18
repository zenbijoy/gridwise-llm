import React from 'react';
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

  const navItems: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-28 md:top-28 left-0 z-20 w-64 h-[calc(100vh-7rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
            {t.systemArchitecture}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Solver Metadata Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1.5 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Optimizer</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{t.optimizerEngine}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>LLM Engine</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{t.llmInterpreter}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Audit Mode</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.auditMode}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
