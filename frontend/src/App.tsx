import React, { useState } from 'react';
import { SAMPLE_SCENARIOS } from './utils/sampleScenarios';
import { useTheme } from './hooks/useTheme';
import { useHealthCheck } from './hooks/useHealthCheck';
import { loadHistory, saveHistoryItem, clearHistory } from './utils/storage';
import { optimizeEnergy, ApiError } from './services/api';
import { Language, translations } from './utils/i18n';
import {
  HourData,
  BatteryConfig,
  OptimizeRequest,
  OptimizeResponse,
  OptimizationHistoryItem,
} from './types';

// Components
import { Header } from './components/Header';
import { MenuBar } from './components/MenuBar';
import { Sidebar, NavSection } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { ScenarioEditor } from './components/ScenarioEditor';
import { BatteryPanel } from './components/BatteryPanel';
import { EnergyTable } from './components/EnergyTable';
import { InterpretationView } from './components/InterpretationView';
import { ResultsView } from './components/ResultsView';
import { DirectiveTimeline } from './components/DirectiveTimeline';
import { EnergyChart } from './charts/EnergyChart';
import { TariffChart } from './charts/TariffChart';
import { BatterySocChart } from './charts/BatterySocChart';
import { HistoryDrawer } from './components/HistoryDrawer';
import { JsonModal } from './components/JsonModal';
import { ApiDocsModal } from './components/ApiDocsModal';
import { LoadingOverlay } from './components/LoadingOverlay';

// Icons
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { status: healthStatus, refresh: refreshHealth } = useHealthCheck();

  // Language state (defaulting to Bangla, with instantaneous toggle to English)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gridwise_lang');
    return saved === 'en' || saved === 'bn' ? saved : 'bn';
  });

  const handleToggleLanguage = () => {
    setLanguage((prev) => {
      const next: Language = prev === 'en' ? 'bn' : 'en';
      localStorage.setItem('gridwise_lang', next);
      return next;
    });
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gridwise_lang', lang);
  };

  const t = translations[language];

  // Active scenario state (defaults to SAMPLE-01)
  const defaultPreset = SAMPLE_SCENARIOS[0];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [scenarioId, setScenarioId] = useState<string>(defaultPreset.input.scenario_id);
  const [operatorNotes, setOperatorNotes] = useState<string[]>(defaultPreset.input.operator_notes);
  const [hours, setHours] = useState<HourData[]>(defaultPreset.input.hours);
  const [battery, setBattery] = useState<BatteryConfig>(defaultPreset.input.battery);

  // Optimization state & timing
  const [response, setResponse] = useState<OptimizeResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [solveDurationMs, setSolveDurationMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Navigation & Drawer states
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [jsonModalOpen, setJsonModalOpen] = useState<boolean>(false);
  const [apiDocsModalOpen, setApiDocsModalOpen] = useState<boolean>(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<OptimizationHistoryItem[]>(() => loadHistory());

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const found = SAMPLE_SCENARIOS.find((p) => p.id === presetId);
    if (found) {
      setScenarioId(found.input.scenario_id);
      setOperatorNotes([...found.input.operator_notes]);
      setHours(JSON.parse(JSON.stringify(found.input.hours)));
      setBattery({ ...found.input.battery });
      setResponse(null);
      setErrorMsg(null);
    }
  };

  // Handle hour cell change
  const handleHourChange = (index: number, field: keyof HourData, val: number) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: val };
    setHours(updated);
    setSelectedPresetId('custom');
  };

  // Reset hours to current preset
  const handleResetHours = () => {
    const preset = SAMPLE_SCENARIOS.find((p) => p.id === selectedPresetId) || defaultPreset;
    setHours(JSON.parse(JSON.stringify(preset.input.hours)));
  };

  // Handle battery field change
  const handleBatteryChange = (field: keyof BatteryConfig, val: number) => {
    setBattery((prev) => ({ ...prev, [field]: val }));
    setSelectedPresetId('custom');
  };

  // Run Optimization pipeline with high-resolution duration measurement
  const handleOptimize = async () => {
    const trimmedNotes = operatorNotes.map((n) => n.trim()).filter((n) => n.length > 0);
    if (trimmedNotes.length === 0) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে অপটিমাইজ করার আগে অন্তত একটি বৈধ অপারেটর নোট প্রদান করুন।'
          : 'Please provide at least one valid operator note before optimizing.'
      );
      return;
    }
    if (trimmedNotes.length > 3) {
      setErrorMsg(
        language === 'bn'
          ? 'প্রতি রিকোয়েস্টে সর্বোচ্চ ৩টি অপারেটর নোট দেওয়া যাবে।'
          : 'A maximum of 3 operator notes is permitted per request.'
      );
      return;
    }

    const payload: OptimizeRequest = {
      scenario_id: scenarioId.trim() || 'SCENARIO-CUSTOM',
      operator_notes: trimmedNotes,
      hours,
      battery,
    };

    setIsOptimizing(true);
    setErrorMsg(null);
    const startTime = Date.now();

    try {
      const result = await optimizeEnergy(payload);
      setSolveDurationMs(Date.now() - startTime);
      setResponse(result);
      const updatedHistory = saveHistoryItem(payload, result);
      setHistory(updatedHistory);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMsg(
        apiErr.message ||
          (language === 'bn'
            ? 'অপটিমাইজেশনের সময় একটি অপ্রত্যাশিত সমস্যা ঘটেছে।'
            : 'An unexpected error occurred during optimization.')
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  // Export current solution JSON
  const handleExportJson = () => {
    if (!response) return;
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gridwise-${scenarioId.toLowerCase()}-optimal.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restore previous run from history
  const handleSelectHistoryItem = (item: OptimizationHistoryItem) => {
    setScenarioId(item.request.scenario_id);
    setOperatorNotes([...item.request.operator_notes]);
    setHours(JSON.parse(JSON.stringify(item.request.hours)));
    setBattery({ ...item.request.battery });
    setResponse(item.response);
    setSelectedPresetId('custom');
    setErrorMsg(null);
  };

  // Handle section click
  const handleSelectSection = (section: NavSection) => {
    if (section === 'docs') {
      setApiDocsModalOpen(true);
      return;
    }
    if (section === 'history') {
      setHistoryDrawerOpen(true);
      return;
    }
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header Bar */}
      <Header
        presets={SAMPLE_SCENARIOS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        healthStatus={healthStatus}
        onRefreshHealth={refreshHealth}
        theme={theme}
        onToggleTheme={toggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        solveDurationMs={solveDurationMs}
      />

      {/* Professional Desktop/App Menu Bar */}
      <MenuBar
        language={language}
        onSelectLanguage={handleSelectLanguage}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onSelectPreset={handleSelectPreset}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        onRefreshHealth={refreshHealth}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenJsonModal={() => setJsonModalOpen(true)}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        onOpenApiDocs={() => setApiDocsModalOpen(true)}
        onResetHours={handleResetHours}
        hasResults={response !== null}
        onExportJson={handleExportJson}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          hasResults={response !== null}
          directiveCount={response?.directive_interpretation.filter((d) => d.applies).length || 0}
          language={language}
        />

        {/* Main Workspace */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm">
                    {language === 'bn' ? 'অপটিমাইজেশন ব্যর্থ হয়েছে' : 'Optimization Failed'}
                  </div>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOptimize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Metric Cards */}
          <MetricCards
            response={response}
            hours={hours}
            isOptimizing={isOptimizing}
            language={language}
          />

          {/* Conditional / Multi-view content based on active section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Energy Dispatch Chart */}
              <EnergyChart response={response} hours={hours} />

              {/* Directive Timeline */}
              <DirectiveTimeline interpretations={response?.directive_interpretation || null} />

              {/* Grid with Scenario Input and Battery */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScenarioEditor
                  scenarioId={scenarioId}
                  onChangeScenarioId={(val) => {
                    setScenarioId(val);
                    setSelectedPresetId('custom');
                  }}
                  notes={operatorNotes}
                  onChangeNotes={(val) => {
                    setOperatorNotes(val);
                    setSelectedPresetId('custom');
                  }}
                  language={language}
                />

                <BatteryPanel
                  battery={battery}
                  onChangeBattery={handleBatteryChange}
                  language={language}
                />
              </div>

              {/* AI Operator Interpretation */}
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
                language={language}
              />

              {/* Results & Schedule */}
              <ResultsView response={response} hours={hours} language={language} />
            </div>
          )}

          {activeSection === 'scenario' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ScenarioEditor
                scenarioId={scenarioId}
                onChangeScenarioId={(val) => {
                  setScenarioId(val);
                  setSelectedPresetId('custom');
                }}
                notes={operatorNotes}
                onChangeNotes={(val) => {
                  setOperatorNotes(val);
                  setSelectedPresetId('custom');
                }}
                language={language}
              />
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
                language={language}
              />
            </div>
          )}

          {activeSection === 'matrix' && (
            <div className="animate-in fade-in duration-200">
              <EnergyTable
                hours={hours}
                onChangeHour={handleHourChange}
                onReset={handleResetHours}
                onOpenJsonModal={() => setJsonModalOpen(true)}
              />
            </div>
          )}

          {activeSection === 'battery' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <BatteryPanel
                battery={battery}
                onChangeBattery={handleBatteryChange}
                language={language}
              />
              <BatterySocChart response={response} battery={battery} />
            </div>
          )}

          {activeSection === 'directives' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DirectiveTimeline interpretations={response?.directive_interpretation || null} />
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
                language={language}
              />
            </div>
          )}

          {activeSection === 'results' && (
            <div className="animate-in fade-in duration-200">
              <ResultsView response={response} hours={hours} language={language} />
            </div>
          )}

          {activeSection === 'charts' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <EnergyChart response={response} hours={hours} />
              <TariffChart hours={hours} />
              <BatterySocChart response={response} battery={battery} />
            </div>
          )}
        </main>
      </div>

      {/* JSON Import/Export Modal */}
      <JsonModal
        isOpen={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        currentRequest={{
          scenario_id: scenarioId,
          operator_notes: operatorNotes,
          hours,
          battery,
        }}
        onImport={(imported) => {
          setScenarioId(imported.scenario_id);
          setOperatorNotes(imported.operator_notes);
          setHours(imported.hours);
          setBattery(imported.battery);
          setSelectedPresetId('custom');
          setResponse(null);
        }}
      />

      {/* API Documentation Modal */}
      <ApiDocsModal isOpen={apiDocsModalOpen} onClose={() => setApiDocsModalOpen(false)} />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={() => {
          clearHistory();
          setHistory([]);
        }}
      />

      {/* Multi-stage indeterminate loading overlay */}
      <LoadingOverlay isOpen={isOptimizing} />
    </div>
  );
}

export default App;
