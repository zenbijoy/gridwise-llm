import React, { useState } from 'react';
import { Sun, Zap, BatteryCharging, Building2, SlidersHorizontal, ArrowRight, ArrowDown, ArrowUp } from 'lucide-react';
import { OptimizeResponse, HourData } from '../types';
import { Language, translations } from '../utils/i18n';

interface EnergyFlowDiagramProps {
  response: OptimizeResponse | null;
  hours: HourData[];
  language: Language;
}

export const EnergyFlowDiagram: React.FC<EnergyFlowDiagramProps> = ({
  response,
  hours,
  language,
}) => {
  const t = translations[language];
  // Selected hour mode: -1 for 24-hour aggregate, or 0..23 for specific hour
  const [selectedHour, setSelectedHour] = useState<number>(-1);

  // Aggregates
  const totalDemand = hours.reduce((sum, h) => sum + h.demand_kwh, 0);
  const totalSolar = hours.reduce((sum, h) => sum + h.solar_kwh, 0);
  const totalGrid = response
    ? response.total_grid_kwh
    : hours.reduce((sum, h) => sum + Math.max(0, h.demand_kwh - h.solar_kwh), 0);

  const totalBatteryCharge = response
    ? response.hourly_plan.filter((p) => p.battery_action === 'charge').reduce((sum, p) => sum + p.battery_kwh, 0)
    : 0;
  const totalBatteryDischarge = response
    ? response.hourly_plan.filter((p) => p.battery_action === 'discharge').reduce((sum, p) => sum + p.battery_kwh, 0)
    : 0;

  // Selected hour specific values
  const isHourView = selectedHour >= 0 && selectedHour < hours.length;
  const currentHourData = isHourView ? hours[selectedHour] : null;
  const currentPlan = isHourView && response ? response.hourly_plan[selectedHour] : null;

  const displayDemand = isHourView && currentHourData ? currentHourData.demand_kwh : totalDemand;
  const displaySolar = isHourView
    ? (currentPlan ? currentPlan.solar_used_kwh : (currentHourData ? currentHourData.solar_kwh : 0))
    : (response ? response.hourly_plan.reduce((sum, p) => sum + p.solar_used_kwh, 0) : totalSolar);
  const displayGrid = isHourView
    ? (currentPlan ? currentPlan.grid_kwh : (currentHourData ? Math.max(0, currentHourData.demand_kwh - currentHourData.solar_kwh) : 0))
    : totalGrid;

  const currentBatteryAction = currentPlan ? currentPlan.battery_action : (totalBatteryDischarge > totalBatteryCharge ? 'discharge' : 'charge');
  const displayBattery = isHourView
    ? (currentPlan ? currentPlan.battery_kwh : 0)
    : Math.max(totalBatteryCharge, totalBatteryDischarge);

  const isSolarFlowing = displaySolar > 0;
  const isGridFlowing = displayGrid > 0;
  const isBatteryCharging = currentBatteryAction === 'charge' && displayBattery > 0;
  const isBatteryDischarging = currentBatteryAction === 'discharge' && displayBattery > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar with Scrubbing Control */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {t.energyFlowTitle}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
              {selectedHour === -1 ? (language === 'bn' ? '২৪ ঘণ্টার সামগ্রিক' : '24-Hour Total') : `${selectedHour.toString().padStart(2, '0')}:00`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.energyFlowSubtitle}
          </p>
        </div>

        {/* Hour Scrubber / Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setSelectedHour(-1)}
            className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedHour === -1
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            24H {language === 'bn' ? 'সামগ্রিক' : 'Total'}
          </button>
          <input
            type="range"
            min="0"
            max="23"
            value={selectedHour === -1 ? 12 : selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
            className="w-24 sm:w-32 accent-emerald-500 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
          />
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[3rem] text-right">
            {selectedHour === -1 ? 'All' : `${selectedHour.toString().padStart(2, '0')}:00`}
          </span>
        </div>
      </div>

      {/* SVG Topology & Nodes Visualization */}
      <div className="relative w-full max-w-3xl mx-auto py-4">
        {/* Animated Connecting SVG Lines */}
        <svg
          className="w-full h-72 sm:h-80 select-none"
          viewBox="0 0 600 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. Solar to Campus Path */}
          <path
            d="M 120 70 C 180 70, 240 140, 300 140"
            stroke={isSolarFlowing ? '#10b981' : '#cbd5e1'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className={isSolarFlowing ? 'animate-flow-solar' : ''}
            opacity={isSolarFlowing ? 0.9 : 0.25}
          />

          {/* 2. Grid to Campus Path */}
          <path
            d="M 480 70 C 420 70, 360 140, 300 140"
            stroke={isGridFlowing ? '#3b82f6' : '#cbd5e1'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className={isGridFlowing ? 'animate-flow-grid' : ''}
            opacity={isGridFlowing ? 0.9 : 0.25}
          />

          {/* 3. Solar to Battery Path (when charging) */}
          <path
            d="M 120 70 C 120 180, 200 240, 300 240"
            stroke={isBatteryCharging ? '#06b6d4' : '#cbd5e1'}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={isBatteryCharging ? 'animate-flow-battery-charge' : ''}
            opacity={isBatteryCharging ? 0.8 : 0.2}
          />

          {/* 4. Battery to Campus Path (when discharging) */}
          <path
            d="M 300 240 L 300 140"
            stroke={isBatteryDischarging ? '#8b5cf6' : isBatteryCharging ? '#06b6d4' : '#cbd5e1'}
            strokeWidth="3.5"
            strokeLinecap="round"
            className={
              isBatteryDischarging
                ? 'animate-flow-battery-discharge'
                : isBatteryCharging
                ? 'animate-flow-battery-charge'
                : ''
            }
            opacity={isBatteryCharging || isBatteryDischarging ? 0.9 : 0.25}
          />
        </svg>

        {/* DOM HTML Overlaid Nodes positioned directly at topology coordinates */}

        {/* NODE 1: Solar PV Array (Top Left) */}
        <div className="absolute top-2 left-2 sm:left-6 -translate-y-2 flex flex-col items-center">
          <div className="enterprise-card bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-amber-400/70 shadow-lg shadow-amber-500/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Sun className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                {t.solarFlowLabel}
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white tabular-numbers">
                {displaySolar.toFixed(0)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </div>
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60">
            {isSolarFlowing ? t.generatingBadge : t.standbyBadge}
          </span>
        </div>

        {/* NODE 2: Utility Grid (Top Right) */}
        <div className="absolute top-2 right-2 sm:right-6 -translate-y-2 flex flex-col items-center">
          <div className="enterprise-card bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-blue-400/70 shadow-lg shadow-blue-500/10 flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider text-right">
                {t.gridFlowLabel}
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white tabular-numbers text-right">
                {displayGrid.toFixed(0)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/60">
            {isGridFlowing ? t.importingBadge : t.standbyBadge}
          </span>
        </div>

        {/* NODE 3: Central Campus Load (Center Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="enterprise-card bg-white dark:bg-slate-800 rounded-2xl p-3.5 border-2 border-emerald-500 shadow-xl shadow-emerald-500/15 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                {t.campusLoadLabel}
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white tabular-numbers">
                {displayDemand.toFixed(0)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </div>
            </div>
          </div>
          <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-400/40 shadow-xs">
            {language === 'bn' ? 'সক্রিয় মোট লোড' : 'Campus Demand'}
          </span>
        </div>

        {/* NODE 4: Battery Storage System (Bottom Center) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="enterprise-card bg-white dark:bg-slate-800 rounded-2xl p-3 border-2 border-teal-400/70 shadow-lg shadow-teal-500/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-500 flex items-center justify-center">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 tracking-wider">
                {t.batteryFlowLabel}
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white tabular-numbers">
                {displayBattery.toFixed(0)} <span className="text-xs font-normal text-slate-400">kWh</span>
              </div>
            </div>
          </div>
          <span
            className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isBatteryCharging
                ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300'
                : isBatteryDischarging
                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300'
                : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
          >
            {isBatteryCharging
              ? t.chargingBadge
              : isBatteryDischarging
              ? t.dischargingBadge
              : t.standbyBadge}
          </span>
        </div>
      </div>

      {/* Microgrid Energy Flow Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-emerald-500 rounded-full" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'সৌরবিদ্যুৎ প্রবাহ' : 'Solar Generation'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-blue-500 rounded-full" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'গ্রিড আমদানি' : 'Grid Import'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-cyan-400 rounded-full" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'ব্যাটারি চার্জ' : 'BESS Charge'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-purple-500 rounded-full" />
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'ব্যাটারি ডিসচার্জ' : 'BESS Discharge'}
          </span>
        </div>
      </div>
    </div>
  );
};
