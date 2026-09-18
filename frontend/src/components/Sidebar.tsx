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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpen,
  onCloseMobile,
  hasResults,
  directiveCount,
}) => {
  const navItems: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'scenario', label: 'Scenario & Notes', icon: FileText },
    { id: 'matrix', label: '24-Hour Energy Data', icon: Table },
    { id: 'battery', label: 'Battery Storage', icon: BatteryCharging },
    {
      id: 'directives',
      label: 'AI Interpretation',
      icon: Sparkles,
      badge: hasResults ? directiveCount : undefined,
    },
    {
      id: 'results',
      label: 'Optimal Schedule',
      icon: CheckCircle2,
      badge: hasResults ? 'Verified' : undefined,
    },
    { id: 'charts', label: 'Energy Analytics', icon: LineChart },
    { id: 'history', label: 'Run History', icon: History },
    { id: 'docs', label: 'API & Specs', icon: Code2 },
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
        className={`fixed md:sticky top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
            Microgrid Operations
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
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
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
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
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Optimizer</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">PuLP + CBC LP</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>LLM Engine</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">Gemini 2.5 Flash</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Audit Mode</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">Fail-Closed</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
