import React from 'react';
import { HourData } from '../types';
import { RotateCcw, Download, Upload, Info } from 'lucide-react';

interface EnergyTableProps {
  hours: HourData[];
  onChangeHour: (hourIndex: number, field: keyof HourData, val: number) => void;
  onReset: () => void;
  onOpenJsonModal: () => void;
}

export const EnergyTable: React.FC<EnergyTableProps> = ({
  hours,
  onChangeHour,
  onReset,
  onOpenJsonModal,
}) => {
  const totalDemand = hours.reduce((s, h) => s + h.demand_kwh, 0);
  const totalSolar = hours.reduce((s, h) => s + h.solar_kwh, 0);
  const avgTariff = hours.length > 0 ? hours.reduce((s, h) => s + h.tariff_bdt_per_kwh, 0) / hours.length : 0;

  const handleInputChange = (
    index: number,
    field: keyof HourData,
    rawVal: string
  ) => {
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeHour(index, field, parsed);
    } else if (rawVal === '' || rawVal === '0') {
      onChangeHour(index, field, 0);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>24-Hour Energy Matrix</span>
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Hours 00 – 23
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Campus load demand, solar generation forecast, and time-of-use tariffs. Values are editable inline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenJsonModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Import or Export full Scenario JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>JSON IO</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset matrix to current scenario default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[420px] rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
            <tr>
              <th className="py-2 px-3 font-mono">Hour</th>
              <th className="py-2 px-3">Demand (kWh)</th>
              <th className="py-2 px-3">Solar Forecast (kWh)</th>
              <th className="py-2 px-3">Tariff (৳/kWh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {hours.map((h, i) => (
              <tr key={h.hour} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-1.5 px-3 font-semibold text-slate-500 dark:text-slate-400">
                  {h.hour.toString().padStart(2, '0')}:00
                </td>

                <td className="py-1.5 px-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={h.demand_kwh}
                    onChange={(e) => handleInputChange(i, 'demand_kwh', e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </td>

                <td className="py-1.5 px-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={h.solar_kwh}
                    onChange={(e) => handleInputChange(i, 'solar_kwh', e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </td>

                <td className="py-1.5 px-3">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={h.tariff_bdt_per_kwh}
                    onChange={(e) => handleInputChange(i, 'tariff_bdt_per_kwh', e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/95 font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 font-mono">
            <tr>
              <td className="py-2 px-3 text-slate-500 dark:text-slate-400">Total / Avg</td>
              <td className="py-2 px-3">{totalDemand.toFixed(1)} kWh</td>
              <td className="py-2 px-3">{totalSolar.toFixed(1)} kWh</td>
              <td className="py-2 px-3">৳{avgTariff.toFixed(2)}/kWh</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        <Info className="w-3.5 h-3.5" />
        <span>Optimization is calculated on the FastAPI backend using PuLP + CBC linear programming.</span>
      </div>
    </div>
  );
};
