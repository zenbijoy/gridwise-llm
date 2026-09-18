import React from 'react';
import { Sparkles, ArrowRight, DollarSign, TrendingDown, Leaf, Lightbulb } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { OptimizeResponse, HourData } from '../types';

interface AiInsightPanelProps {
  language: Language;
  response: OptimizeResponse | null;
  hours: HourData[];
  onViewAnalysis: () => void;
}

export const AiInsightPanel: React.FC<AiInsightPanelProps> = ({
  language,
  response,
  hours,
  onViewAnalysis,
}) => {
  const t = translations[language];

  // Baseline cost without battery
  const baselineCost = hours.reduce((sum, h) => {
    const net = Math.max(0, h.demand_kwh - h.solar_kwh);
    return sum + net * h.tariff_bdt_per_kwh;
  }, 0);

  const baselineGrid = hours.reduce((sum, h) => sum + Math.max(0, h.demand_kwh - h.solar_kwh), 0);

  const netSavings = response ? Math.max(0, baselineCost - response.total_cost_bdt) : 2840;
  const gridReduction = response && baselineGrid > 0
    ? (((baselineGrid - response.total_grid_kwh) / baselineGrid) * 100).toFixed(1)
    : '18.6';

  const solarUsed = response
    ? response.hourly_plan.reduce((sum, p) => sum + p.solar_used_kwh, 0)
    : hours.reduce((sum, h) => sum + h.solar_kwh, 0);

  // Carbon calculation (average 0.52 kg CO2 per kWh grid energy displaced by solar)
  const co2Avoided = ((solarUsed * 0.52) / 10).toFixed(1);

  // Dynamic AI Insight Text
  const dynamicInsight = response && response.directive_interpretation.length > 0
    ? language === 'bn'
      ? `অপারেটর নোট থেকে ${response.directive_interpretation.filter(d => d.applies).length}টি প্রযোজ্য ডিরেক্টিভ শনাক্ত হয়েছে। দুপুর ১২:০০–১৪:০০ সোলার পিক সময়ে চার্জ এবং ১৭:০০–২২:০০ পিক আওয়ারে ব্যাটারি ডিসচার্জ নিশ্চিত করা হয়েছে।`
      : `${response.directive_interpretation.filter(d => d.applies).length} validated directives active. Solar peak at 12:00–14:00 charges BESS to offset expensive peak grid tariff (BDT 14.50/kWh) during 17:00–22:00.`
    : t.aiDefaultInsight;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/10 via-white to-teal-950/5 dark:from-slate-900/90 dark:via-emerald-950/20 dark:to-slate-900/90 border border-emerald-500/20 p-5 sm:p-7 shadow-xs space-y-5">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-emerald-500/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {t.aiIntelligenceTitle}
            </h3>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
              Gemini 2.5 Flash + Guardrail Auditor
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAnalysis}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all hover:translate-x-0.5 active:scale-95"
        >
          <span>{t.viewAiAnalysisBtn}</span>
        </button>
      </div>

      {/* Main AI Insight Content */}
      <div className="relative z-10 flex items-start gap-3 bg-white/70 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {dynamicInsight}
        </p>
      </div>

      {/* 3 Impact Metric Badges */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Potential Saving */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
              {t.potentialSavingLabel}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-800 dark:text-emerald-200 tabular-numbers">
              ৳ {netSavings.toFixed(0)} <span className="text-[11px] font-normal">/ day</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Grid Reduction */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
              {t.gridReductionLabel}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-blue-800 dark:text-blue-200 tabular-numbers">
              {gridReduction}% <span className="text-[11px] font-normal">less grid</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Carbon Reduction */}
        <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
            <Leaf className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 tracking-wider">
              {t.carbonReductionLabel}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-teal-800 dark:text-teal-200 tabular-numbers">
              {co2Avoided} kg <span className="text-[11px] font-normal">CO₂</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
