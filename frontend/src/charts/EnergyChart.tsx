import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { OptimizeResponse, HourData } from '../types';

interface EnergyChartProps {
  response: OptimizeResponse | null;
  hours: HourData[];
}

type HorizonFilter = 'Live' | '24H' | '7D' | '30D';

export const EnergyChart: React.FC<EnergyChartProps> = ({ response, hours }) => {
  const [activeFilter, setActiveFilter] = useState<HorizonFilter>('24H');
  const [showDemand, setShowDemand] = useState(true);
  const [showSolar, setShowSolar] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showBattery, setShowBattery] = useState(true);

  const chartData = hours.map((h, idx) => {
    const plan = response?.hourly_plan[idx];
    const batteryNet = plan
      ? plan.battery_action === 'charge'
        ? plan.battery_kwh
        : plan.battery_action === 'discharge'
        ? -plan.battery_kwh
        : 0
      : 0;

    return {
      hour: `${h.hour.toString().padStart(2, '0')}:00`,
      Demand: h.demand_kwh,
      'Solar Forecast': h.solar_kwh,
      'Solar Used': plan ? plan.solar_used_kwh : h.solar_kwh,
      'Grid Import': plan ? plan.grid_kwh : Math.max(0, h.demand_kwh - h.solar_kwh),
      'Battery Net': plan ? batteryNet : 0,
    };
  });

  return (
    <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
      {/* Chart Header Bar with Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Live Energy Dispatch — Next 24 Hours
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hourly balance between campus demand, rooftop solar, battery actions, and grid imports.
          </p>
        </div>

        {/* Top-Right Horizon Filters (Live, 24H, 7D, 30D) */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          {(['Live', '24H', '7D', '30D'] as HorizonFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeFilter === filter
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Series Visibility Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowDemand(!showDemand)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            showDemand
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              : 'opacity-40 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Demand</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSolar(!showSolar)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            showSolar
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              : 'opacity-40 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Solar PV</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            showGrid
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
              : 'opacity-40 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Grid Import</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBattery(!showBattery)}
          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            showBattery
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'opacity-40 border-slate-200 dark:border-slate-700 text-slate-500'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Battery Net</span>
        </button>
      </div>

      {/* Chart Area with Smooth Curves and Gradient Fills */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />

            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={2}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" kWh"
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md p-3 border border-slate-700 shadow-2xl text-xs space-y-1.5 text-white">
                      <div className="font-mono font-bold text-emerald-400 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                        <span>Hour {label}</span>
                        <span className="text-[10px] text-slate-400">Microgrid Telemetry</span>
                      </div>
                      {payload.map((entry, index) => (
                        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-bold text-white tabular-numbers">
                            {Number(entry.value).toFixed(1)} kWh
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {showDemand && (
              <Area
                type="monotone"
                dataKey="Demand"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#demandGrad)"
                name="Demand"
              />
            )}

            {showSolar && (
              <Area
                type="monotone"
                dataKey="Solar Used"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#solarGrad)"
                name="Solar Used"
              />
            )}

            {showGrid && (
              <Line
                type="monotone"
                dataKey="Grid Import"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#3b82f6' }}
                name="Grid Import"
              />
            )}

            {showBattery && (
              <Area
                type="monotone"
                dataKey="Battery Net"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#batteryGrad)"
                dot={{ r: 2, fill: '#10b981' }}
                name="Battery Net (Chg - Disch)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
