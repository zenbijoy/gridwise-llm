import React from 'react';
import { OptimizeResponse, HourData } from '../types';
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle, Minus, Copy, Check } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface ResultsViewProps {
  response: OptimizeResponse | null;
  hours: HourData[];
  language?: Language;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ response, hours, language = 'en' }) => {
  const [copied, setCopied] = React.useState(false);
  const t = translations[language];

  if (!response) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
        <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 text-emerald-500" />
        <p>{language === 'bn' ? 'এখনো কোনো অপটিমাইজেশন চালানো হয়নি। "অপটিমাইজ করুন" বাটনে ক্লিক করুন।' : 'No optimization schedule generated yet. Click "Optimize Energy" to run the pipeline.'}</p>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalDemand = hours.reduce((s, h) => s + h.demand_kwh, 0);
  const totalSolarUsed = response.hourly_plan.reduce((s, p) => s + p.solar_used_kwh, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t.resultsTitle}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
              {t.resultsBadge}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {t.resultsDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? (language === 'bn' ? 'কপি হয়েছে!' : 'Copied JSON!') : (language === 'bn' ? 'JSON কপি করুন' : 'Copy Result JSON')}</span>
        </button>
      </div>

      {/* Plan Narrative Summary Card */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
        <span className="font-bold text-emerald-800 dark:text-emerald-300 mr-1.5 uppercase text-[10px] tracking-wider block sm:inline">
          {language === 'bn' ? 'এক্সিকিউটিভ ডিসপ্যাচ সামারি:' : 'Executive Dispatch Summary:'}
        </span>
        {response.plan_summary}
      </div>

      {/* 24-Hour Hourly Plan Table */}
      <div className="overflow-x-auto max-h-[460px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
            <tr>
              <th className="py-2.5 px-3 font-mono">{t.colHour}</th>
              <th className="py-2.5 px-3 font-mono">{t.colDemand}</th>
              <th className="py-2.5 px-3 font-mono">{t.colSolar}</th>
              <th className="py-2.5 px-3 font-mono">{t.gridImportKwh}</th>
              <th className="py-2.5 px-3">{t.batteryAction}</th>
              <th className="py-2.5 px-3 font-mono">± Action (kWh)</th>
              <th className="py-2.5 px-3 font-mono">{t.batteryEnergyAfter}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
            {response.hourly_plan.map((p, idx) => {
              const d = hours[idx]?.demand_kwh ?? 0;
              const isCharging = p.battery_action === 'charge';
              const isDischarging = p.battery_action === 'discharge';

              return (
                <tr key={p.hour} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-500 dark:text-slate-400">
                    {p.hour.toString().padStart(2, '0')}:00
                  </td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{d.toFixed(1)}</td>
                  <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{p.solar_used_kwh.toFixed(1)}</td>
                  <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-bold">{p.grid_kwh.toFixed(1)}</td>

                  {/* Battery Action Badge */}
                  <td className="py-2 px-3 font-sans">
                    {isCharging ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <ArrowDownCircle className="w-3 h-3 text-emerald-600" />
                        {language === 'bn' ? 'চার্জ' : 'Charge'}
                      </span>
                    ) : isDischarging ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        <ArrowUpCircle className="w-3 h-3 text-purple-600" />
                        {language === 'bn' ? 'ডিসচার্জ' : 'Discharge'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <Minus className="w-3 h-3" />
                        {language === 'bn' ? 'আইডল' : 'Idle'}
                      </span>
                    )}
                  </td>

                  {/* Rate */}
                  <td className="py-2 px-3 font-bold">
                    {isCharging ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+{p.battery_kwh.toFixed(1)}</span>
                    ) : isDischarging ? (
                      <span className="text-purple-600 dark:text-purple-400">-{p.battery_kwh.toFixed(1)}</span>
                    ) : (
                      <span className="text-slate-400">0.0</span>
                    )}
                  </td>

                  {/* SOC After */}
                  <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {p.battery_energy_after_kwh.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-100 dark:bg-slate-800/95 font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 font-mono text-xs shadow">
            <tr>
              <td className="py-2.5 px-3">{language === 'bn' ? 'সর্বমোট' : 'Totals'}</td>
              <td className="py-2.5 px-3">{totalDemand.toFixed(1)} kWh</td>
              <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">{totalSolarUsed.toFixed(1)} kWh</td>
              <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-black">{response.total_grid_kwh.toFixed(1)} kWh</td>
              <td colSpan={2} className="py-2.5 px-3 text-right">{t.totalCost}:</td>
              <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-black">
                ৳{response.total_cost_bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
