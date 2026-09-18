import React, { useState } from 'react';
import { SAMPLE_SCENARIOS } from './utils/sampleScenarios';
import { useTheme } from './hooks/useTheme';
import { useHealthCheck } from './hooks/useHealthCheck';
import { loadHistory, saveHistoryItem, clearHistory } from './utils/storage';
import { optimizeEnergy, ApiError } from './services/api';
import {
  HourData,
  BatteryConfig,
  OptimizeRequest,
  OptimizeResponse,
  OptimizationHistoryItem,
} from './types';

// Components
import { Header } from './components/Header';
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
import { AlertCircle, RefreshCw, Edit3 } from 'lucide-react';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { status: healthStatus, refresh: refreshHealth } = useHealthCheck();

  // Active scenario state (defaults to SAMPLE-01)
  const defaultPreset = SAMPLE_SCENARIOS[0];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [scenarioId, setScenarioId] = useState<string>(defaultPreset.input.scenario_id);
  const [operatorNotes, setOperatorNotes] = useState<string[]>(defaultPreset.input.operator_notes);
  const [hours, setHours] = useState<HourData[]>(defaultPreset.input.hours);
  const [battery, setBattery] = useState<BatteryConfig>(defaultPreset.input.battery);

  // Optimization state
  const [response, setResponse] = useState<OptimizeResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
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

  // Run Optimization pipeline
  const handleOptimize = async () => {
    // Client-side validation
    const trimmedNotes = operatorNotes.map((n) => n.trim()).filter((n) => n.length > 0);
    if (trimmedNotes.length === 0) {
      setErrorMsg('Please provide at least one valid operator note before optimizing.');
      return;
    }
    if (trimmedNotes.length > 3) {
      setErrorMsg('A maximum of 3 operator notes is permitted per request.');
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

    try {
      const result = await optimizeEnergy(payload);
      setResponse(result);
      const updatedHistory = saveHistoryItem(payload, result);
      setHistory(updatedHistory);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.message || 'An unexpected error occurred during optimization.');
    } finally {
      setIsOptimizing(false);
    }
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

  // Handle section click from sidebar
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
      {/* Header */}
      <Header
        presets={SAMPLE_SCENARIOS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        healthStatus={healthStatus}
        onRefreshHealth={refreshHealth}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          isOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          hasResults={response !== null}
          directiveCount={response?.directive_interpretation.filter((d) => d.applies).length || 0}
        />

        {/* Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Optimization Failed</div>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOptimize}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Metric Cards */}
          <MetricCards response={response} hours={hours} isOptimizing={isOptimizing} />

          {/* Conditional / Multi-view content based on active section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
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
                />

                <BatteryPanel battery={battery} onChangeBattery={handleBatteryChange} />
              </div>

              {/* AI Operator Interpretation */}
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
              />

              {/* Results & Schedule */}
              <ResultsView response={response} hours={hours} />
            </div>
          )}

          {activeSection === 'scenario' && (
            <div className="space-y-6">
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
              />
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
              />
            </div>
          )}

          {activeSection === 'matrix' && (
            <EnergyTable
              hours={hours}
              onChangeHour={handleHourChange}
              onReset={handleResetHours}
              onOpenJsonModal={() => setJsonModalOpen(true)}
            />
          )}

          {activeSection === 'battery' && (
            <div className="space-y-6">
              <BatteryPanel battery={battery} onChangeBattery={handleBatteryChange} />
              <BatterySocChart response={response} battery={battery} />
            </div>
          )}

          {activeSection === 'directives' && (
            <div className="space-y-6">
              <DirectiveTimeline interpretations={response?.directive_interpretation || null} />
              <InterpretationView
                interpretations={response?.directive_interpretation || null}
                operatorNotes={operatorNotes}
              />
            </div>
          )}

          {activeSection === 'results' && (
            <ResultsView response={response} hours={hours} />
          )}

          {activeSection === 'charts' && (
            <div className="space-y-6">
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
