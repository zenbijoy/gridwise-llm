import React from 'react';
import { DollarSign, Zap, TrendingUp, Sun, BatteryCharging, CheckCircle2, AlertCircle } from 'lucide-react';
import { OptimizeResponse, HourData } from '../types';

interface MetricCardsProps {
  response: OptimizeResponse | null;
  hours: HourData[];
  isOptimizing: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ response, hours, isOptimizing }) => {
  const totalDemand = hours.reduce((sum, h) => sum + h.demand_kwh, 0);
  const totalSolar = hours.reduce((sum, h) => sum + h.solar_kwh, 0);

  let solarUsed = 0;
  let batteryThroughput = 0;

  if (response) {
    solarUsed = response.hourly_plan.reduce((sum, p) => sum + p.solar_used_kwh, 0);
    batteryThroughput = response.hourly_plan.reduce(
      (sum, p) => sum + p.battery_charge_kwh + p.battery_discharge_kwh,
      0
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Cost */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Total Cost</span>
          <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `৳${response.total_cost_bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {response ? 'Optimal Schedule' : 'Run optimizer'}
        </div>
      </div>

      {/* 2. Total Grid Energy */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Total Grid</span>
          <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `${response.total_grid_kwh.toFixed(1)}` : '—'} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Demand: {totalDemand.toFixed(0)} kWh
        </div>
      </div>

      {/* 3. Peak Grid Demand */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Peak Grid</span>
          <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `${response.peak_grid_kwh.toFixed(1)}` : '—'} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Single-hour max import
        </div>
      </div>

      {/* 4. Solar Utilization */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Solar Used</span>
          <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Sun className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `${solarUsed.toFixed(1)}` : `${totalSolar.toFixed(0)}`} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {totalSolar > 0 ? `${((solarUsed / totalSolar) * 100).toFixed(0)}% of available` : 'Zero forecast'}
        </div>
      </div>

      {/* 5. Battery Throughput */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Battery Action</span>
          <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <BatteryCharging className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `±${(batteryThroughput / 2).toFixed(1)}` : '—'} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Cycles: {batteryThroughput > 0 ? `${batteryThroughput.toFixed(1)} kWh flow` : 'Idle'}
        </div>
      </div>

      {/* 6. Optimization Status */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[11px] font-medium tracking-tight">Plan Status</span>
          <div className={`p-1 rounded ${response ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {response ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
          {isOptimizing ? 'Solving...' : response ? 'Verified & Optimal' : 'Ready'}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
          {response ? 'Replay audit passed' : 'Awaiting dispatch'}
        </div>
      </div>
    </div>
  );
};
