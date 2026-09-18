import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Play,
  LayoutDashboard,
  Table,
  BatteryCharging,
  Sparkles,
  CheckCircle2,
  LineChart,
  History,
  Code2,
  Moon,
  Sun,
  Globe,
  Upload,
  Download,
  RotateCcw,
  Server,
  HelpCircle,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { NavSection } from './Sidebar';

interface MenuBarProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onSelectPreset: (presetId: string) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  onRefreshHealth: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenJsonModal: () => void;
  onOpenHistory: () => void;
  onOpenApiDocs: () => void;
  onResetHours: () => void;
  hasResults: boolean;
  onExportJson?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  language,
  onSelectLanguage,
  activeSection,
  onSelectSection,
  onSelectPreset,
  onOptimize,
  isOptimizing,
  onRefreshHealth,
  theme,
  onToggleTheme,
  onOpenJsonModal,
  onOpenHistory,
  onOpenApiDocs,
  onResetHours,
  hasResults,
  onExportJson,
}) => {
  const t = translations[language];
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState<boolean>(false);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuKey: string) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  const handleAction = (callback: () => void) => {
    setOpenMenu(null);
    callback();
  };

  return (
    <>
      <div
        ref={menuBarRef}
        className="w-full bg-slate-100/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 select-none relative z-20 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Menu Items (File, Operations, View, Language, Tools, Help) */}
          <div className="flex items-center space-x-1 py-1">
            {/* 1. File Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('file')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'file'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{t.menuFile}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'file' && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'bn' ? 'অফিশিয়াল স্যাম্পল সিনারিও' : 'Official Sample Scenarios'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectPreset('SAMPLE-01'))}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Sample 01 (Cloud Cover + Cleaning)</span>
                    <span className="text-[10px] font-mono opacity-50">Ref: ৳38k</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectPreset('SAMPLE-02'))}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Sample 02 (High Peak Demand)</span>
                    <span className="text-[10px] font-mono opacity-50">Peak Cap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectPreset('SAMPLE-03'))}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Sample 03 (Auditorium Reserve Event)</span>
                    <span className="text-[10px] font-mono opacity-50">Reserve Floor</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => handleAction(onOpenJsonModal)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'bn' ? 'সিনারিও JSON ইমপোর্ট / এডিট...' : 'Import / Edit Scenario JSON...'}</span>
                  </button>

                  {hasResults && (
                    <button
                      type="button"
                      onClick={() => handleAction(() => onExportJson && onExportJson())}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.exportJson}</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => handleAction(onResetHours)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-amber-600 dark:text-amber-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.resetDefault}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Operations Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('operations')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'operations'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{t.menuOperations}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'operations' && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAction(onOptimize)}
                    disabled={isOptimizing}
                    className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isOptimizing ? t.optimizing : t.optimizeEnergy}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => handleAction(onRefreshHealth)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'bn' ? 'এপিআই হেলথ চেক করুন' : 'Refresh API Health Probe'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(onOpenHistory)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.navHistory}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. View Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('view')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'view'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{t.menuView}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'view' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('dashboard'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'dashboard' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>{t.navDashboard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('scenario'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'scenario' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.navScenario}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('matrix'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'matrix' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{t.navMatrix}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('battery'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'battery' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BatteryCharging className="w-3.5 h-3.5" />
                    <span>{t.navBattery}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('directives'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'directives' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.navDirectives}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('results'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'results' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.navResults}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectSection('charts'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                      activeSection === 'charts' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>{t.navCharts}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => handleAction(onToggleTheme)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{theme === 'dark' ? (language === 'bn' ? 'লাইট মোড' : 'Light Mode') : (language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Language Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('language')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'language'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <Globe className="w-3 h-3 text-emerald-500" />
                <span>{t.menuLanguage}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'language' && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectLanguage('bn'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
                      language === 'bn' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇧🇩 বাংলা (Bengali)</span>
                    {language === 'bn' && <span>✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(() => onSelectLanguage('en'))}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
                      language === 'en' ? 'bg-emerald-50 dark:bg-slate-800 font-bold text-emerald-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇺🇸 English</span>
                    {language === 'en' && <span>✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 5. Tools Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('tools')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'tools'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{t.menuTools}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'tools' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenApiDocs)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.navDocs} (Swagger UI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenHistory)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.navHistory}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(onOpenJsonModal)}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t.editJson}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Help Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => handleMenuClick('help')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  openMenu === 'help'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-200/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{t.menuHelp}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {openMenu === 'help' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => handleAction(() => setAboutModalOpen(true))}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5 text-teal-500" />
                    <span>{language === 'bn' ? 'গ্রিডওয়াইজ পরিচিতি' : 'About GridWise LLM'}</span>
                  </button>
                  <a
                    href="https://github.com/zenbijoy/gridwise-llm"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>GitHub Repository</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Status Badge in MenuBar */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono">PuLP CBC • Gemini 2.5 • OpenRouter Fallback</span>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold">
                GW
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">GridWise LLM</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  BUP CSE Fest 2026 Preliminary Hackathon
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'bn'
                ? 'গ্রিডওয়াইজ এলএলএম হলো একটি প্রোডাকশন-গ্রেড এনার্জি ম্যানেজমেন্ট প্ল্যাটফর্ম যা নিউরো-সিম্বলিক আর্কিটেকচারের মাধ্যমে মানুষের প্রাকৃতিক ভাষার অপারেটর নির্দেশাবলী গ্রহণ করে এবং PuLP + CBC লিনিয়ার প্রোগ্রামিং দ্বারা সর্বনিম্ন খরচে ২৪ ঘণ্টার মাইক্রোগ্রিড শিডিউল সমাধান করে।'
                : 'GridWise LLM is a production-grade energy optimization platform that combines Gemini natural language interpretation with PuLP + CBC linear programming to deliver provably cost-minimal 24-hour microgrid schedules.'}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
