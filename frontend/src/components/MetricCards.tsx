import React from 'react';
import { DollarSign, Zap, TrendingUp, Sun, BatteryCharging, CheckCircle2, Clock } from 'lucide-react';
import { OptimizeResponse, HourData } from '../types';
import { Language, translations } from '../utils/i18n';

interface MetricCardsProps {
  response: OptimizeResponse | null;
  hours: HourData[];
  isOptimizing: boolean;
  language?: Language;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  response,
  hours,
  isOptimizing,
  language = 'en',
}) => {
  const t = translations[language];

  const totalDemand = hours.reduce((sum, h) => sum + h.demand_kwh, 0);
  const totalSolar = hours.reduce((sum, h) => sum + h.solar_kwh, 0);

  let solarUsed = 0;
  let batteryThroughput = 0;

  if (response) {
    solarUsed = response.hourly_plan.reduce((sum, p) => sum + p.solar_used_kwh, 0);
    batteryThroughput = response.hourly_plan.reduce((sum, p) => sum + p.battery_kwh, 0);
  }

  // Baseline cost without battery (grid purchases whatever load remains after solar)
  const baselineCost = hours.reduce((sum, h) => {
    const net = Math.max(0, h.demand_kwh - h.solar_kwh);
    return sum + net * h.tariff_bdt_per_kwh;
  }, 0);

  const netSavings = response ? Math.max(0, baselineCost - response.total_cost_bdt) : 0;
  const savingsPct = baselineCost > 0 && response ? ((netSavings / baselineCost) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Cost */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{t.totalCost}</span>
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `৳${response.total_cost_bdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
        </div>
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
          {response ? `+${savingsPct}% ${t.savingsRatio}` : language === 'bn' ? 'অপেক্ষা করছে' : 'Awaiting dispatch'}
        </div>
      </div>

      {/* 2. Net Savings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{t.netSavings}</span>
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
          {response ? `৳${netSavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
          {language === 'bn' ? `বেসলাইন: ৳${baselineCost.toFixed(0)}` : `Baseline: ৳${baselineCost.toFixed(0)}`}
        </div>
      </div>

      {/* 3. Total Grid Energy */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{language === 'bn' ? 'গ্রিড ক্রয়' : 'Total Grid'}</span>
          <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `${response.total_grid_kwh.toFixed(1)}` : '—'} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {language === 'bn' ? `চাহিদা: ${totalDemand.toFixed(0)} kWh` : `Demand: ${totalDemand.toFixed(0)} kWh`}
        </div>
      </div>

      {/* 4. Solar Utilization */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{t.usableSolar}</span>
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `${solarUsed.toFixed(1)}` : `${totalSolar.toFixed(0)}`} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {totalSolar > 0 ? `${((solarUsed / totalSolar) * 100).toFixed(0)}% ${language === 'bn' ? 'ব্যবহার' : 'used'}` : '0 kWh'}
        </div>
      </div>

      {/* 5. Battery Throughput */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{t.batteryThroughput}</span>
          <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
            <BatteryCharging className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
          {response ? `±${(batteryThroughput / 2).toFixed(0)}` : '—'} <span className="text-xs font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {batteryThroughput > 0 ? `${batteryThroughput.toFixed(0)} kWh flow` : (language === 'bn' ? 'স্ট্যান্ডবাই' : 'Standby')}
        </div>
      </div>

      {/* 6. Optimization Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-bold tracking-tight uppercase">{t.solverStatus}</span>
          <div className={`p-1.5 rounded-xl ${response ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {response ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </div>
        </div>
        <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
          {isOptimizing ? (language === 'bn' ? 'অপটিমাইজ হচ্ছে...' : 'Solving...') : response ? t.optimalStatus : (language === 'bn' ? 'প্রস্তুত' : 'Ready')}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
          {response ? t.auditPassed : (language === 'bn' ? '২৪ ঘণ্টার শিডিউল' : '24h Horizon')}
        </div>
      </div>
    </div>
  );
};
