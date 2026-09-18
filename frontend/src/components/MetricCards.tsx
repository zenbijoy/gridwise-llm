import React from 'react';
import {
  DollarSign,
  Zap,
  TrendingUp,
  Sun,
  BatteryCharging,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
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

  // Base calculations
  const totalDemand = hours.reduce((sum, h) => sum + h.demand_kwh, 0);
  const totalSolar = hours.reduce((sum, h) => sum + h.solar_kwh, 0);

  let solarUsed = 0;
  let batteryThroughput = 0;
  let totalGrid = 0;

  if (response) {
    solarUsed = response.hourly_plan.reduce((sum, p) => sum + p.solar_used_kwh, 0);
    batteryThroughput = response.hourly_plan.reduce((sum, p) => sum + p.battery_kwh, 0);
    totalGrid = response.total_grid_kwh;
  }

  // Baseline cost without battery (net load * tariff)
  const baselineCost = hours.reduce((sum, h) => {
    const net = Math.max(0, h.demand_kwh - h.solar_kwh);
    return sum + net * h.tariff_bdt_per_kwh;
  }, 0);

  // Baseline grid import without battery
  const baselineGrid = hours.reduce((sum, h) => sum + Math.max(0, h.demand_kwh - h.solar_kwh), 0);

  const netSavings = response ? Math.max(0, baselineCost - response.total_cost_bdt) : 0;
  const savingsPct = baselineCost > 0 && response ? ((netSavings / baselineCost) * 100).toFixed(1) : '0';

  const gridReduction = response && baselineGrid > 0
    ? (((baselineGrid - totalGrid) / baselineGrid) * 100).toFixed(1)
    : '0';

  const renewablePct = totalDemand > 0
    ? (((response ? solarUsed : totalSolar) / totalDemand) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Total Optimization Cost */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {t.totalCost}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
            {response
              ? `৳${response.total_cost_bdt.toLocaleString('en-US', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}`
              : '—'}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          {response ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{savingsPct}% {language === 'bn' ? 'সাশ্রয়' : 'vs baseline'}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">
              {language === 'bn' ? 'বেসলাইন: ' : 'Base: '}৳{baselineCost.toFixed(0)}
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-mono">24H</span>
        </div>
      </div>

      {/* 2. Total Electricity Consumption */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-rose-500/40 dark:hover:border-rose-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {t.totalDemand}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
            {totalDemand.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {language === 'bn' ? 'ক্যাম্পাস মোট চাহিদা' : 'Gross campus load'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">100%</span>
        </div>
      </div>

      {/* 3. Grid Purchase */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 dark:hover:border-blue-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {language === 'bn' ? 'গ্রিড ক্রয়' : 'Grid Purchase'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
            {response ? `${totalGrid.toFixed(0)}` : `${baselineGrid.toFixed(0)}`}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          {response && Number(gridReduction) > 0 ? (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>↓ {gridReduction}% {language === 'bn' ? 'হ্রাস' : 'reduction'}</span>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">
              {language === 'bn' ? 'গ্রিড নির্ভরতা' : 'Grid import'}
            </span>
          )}
          <span className="text-[10px] text-blue-500 font-mono font-bold">Grid</span>
        </div>
      </div>

      {/* 4. Renewable Energy */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {language === 'bn' ? 'নবায়নযোগ্য সৌরবিদ্যুৎ' : 'Renewable Solar'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-200">
              <Sun className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
            {response ? `${solarUsed.toFixed(0)}` : `${totalSolar.toFixed(0)}`}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
            <span>{renewablePct}% {language === 'bn' ? 'চাহিদা পূরণ' : 'of demand'}</span>
          </div>
          <span className="text-[10px] text-amber-500 font-mono font-bold">Solar</span>
        </div>
      </div>

      {/* 5. Battery Schedule & Charge */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-teal-500/40 dark:hover:border-teal-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {language === 'bn' ? 'ব্যাটারি শিডিউল' : 'Battery Storage'}
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white tabular-numbers">
            {response ? `±${(batteryThroughput / 2).toFixed(0)}` : '0'}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-teal-600 dark:text-teal-400 font-bold">
            {batteryThroughput > 0 ? (language === 'bn' ? 'সাইকেল সক্রিয়' : 'Active Flow') : (language === 'bn' ? 'স্ট্যান্ডবাই' : 'Standby')}
          </span>
          <span className="text-[10px] text-teal-500 font-mono font-bold">BESS</span>
        </div>
      </div>

      {/* 6. Solver Status */}
      <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/40 flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] font-bold tracking-tight uppercase">
              {t.solverStatus}
            </span>
            <div
              className={`p-2 rounded-xl ${
                response
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              } group-hover:scale-110 transition-all duration-200`}
            >
              {response ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
            {isOptimizing
              ? language === 'bn'
                ? 'সমাধান হচ্ছে...'
                : 'Solving...'
              : response
              ? t.optimalStatus
              : language === 'bn'
              ? 'প্রস্তুত'
              : 'Ready'}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{response ? (language === 'bn' ? 'অডিট উত্তীর্ণ' : 'Verified') : 'PuLP + CBC'}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">LP</span>
        </div>
      </div>
    </div>
  );
};
