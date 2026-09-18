import React from 'react';
import { BatteryConfig } from '../types';
import { Battery, ShieldCheck, Zap, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface BatteryPanelProps {
  battery: BatteryConfig;
  onChangeBattery: (field: keyof BatteryConfig, val: number) => void;
  language?: Language;
}

export const BatteryPanel: React.FC<BatteryPanelProps> = ({
  battery,
  onChangeBattery,
  language = 'en',
}) => {
  const t = translations[language];

  const initialPct = battery.capacity_kwh > 0 ? Math.min(100, Math.max(0, (battery.initial_energy_kwh / battery.capacity_kwh) * 100)) : 0;
  const reservePct = battery.capacity_kwh > 0 ? Math.min(100, Math.max(0, (battery.minimum_energy_kwh / battery.capacity_kwh) * 100)) : 0;

  const handleInputChange = (field: keyof BatteryConfig, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeBattery(field, parsed);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t.batteryTitle}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {t.batteryBadge}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {t.batteryDesc}
          </p>
        </div>
      </div>

      {/* Visual Battery Gauge */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{t.socGauge}</span>
          </div>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
            {initialPct.toFixed(0)}% {t.initialSoc}
          </span>
        </div>

        {/* Battery Container graphic */}
        <div className="relative w-full h-8 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 shadow-inner">
          {/* Minimum Reserve Region */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-rose-500/25 dark:bg-rose-500/35 border-r-2 border-rose-500 z-10"
            style={{ width: `${reservePct}%` }}
            title={`${t.minReserveFloor}: ${battery.minimum_energy_kwh} kWh (${reservePct.toFixed(0)}%)`}
          />

          {/* Current Initial Energy fill */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-l-md transition-all duration-300"
            style={{ width: `${initialPct}%` }}
          />
        </div>

        {/* Legend / Key below bar */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/50 border border-rose-500 inline-block" />
            <span>{t.minReserveFloor}: {battery.minimum_energy_kwh} kWh ({reservePct.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>{t.initialSoc}: {battery.initial_energy_kwh} kWh</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
            <span>{t.capacityKwh}: {battery.capacity_kwh} kWh</span>
          </div>
        </div>
      </div>

      {/* Numerical Inputs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Capacity */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span>{t.capacityKwh}</span>
          </label>
          <input
            type="number"
            min="1"
            value={battery.capacity_kwh}
            onChange={(e) => handleInputChange('capacity_kwh', e.target.value)}
            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Initial Energy */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Battery className="w-3 h-3 text-cyan-500" />
            <span>{t.initialEnergyKwh}</span>
          </label>
          <input
            type="number"
            min="0"
            value={battery.initial_energy_kwh}
            onChange={(e) => handleInputChange('initial_energy_kwh', e.target.value)}
            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Minimum Energy Reserve */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-rose-500" />
            <span>{t.minReserveKwh}</span>
          </label>
          <input
            type="number"
            min="0"
            value={battery.minimum_energy_kwh}
            onChange={(e) => handleInputChange('minimum_energy_kwh', e.target.value)}
            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Max Charge / Hour */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowDownCircle className="w-3 h-3 text-emerald-500" />
            <span>{t.chargeRateKw}</span>
          </label>
          <input
            type="number"
            min="1"
            value={battery.max_charge_kwh_per_hour}
            onChange={(e) => handleInputChange('max_charge_kwh_per_hour', e.target.value)}
            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Max Discharge / Hour */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpCircle className="w-3 h-3 text-purple-500" />
            <span>{t.dischargeRateKw}</span>
          </label>
          <input
            type="number"
            min="1"
            value={battery.max_discharge_kwh_per_hour}
            onChange={(e) => handleInputChange('max_discharge_kwh_per_hour', e.target.value)}
            className="w-full text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
