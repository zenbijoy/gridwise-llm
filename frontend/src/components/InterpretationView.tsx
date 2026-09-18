import React from 'react';
import { DirectiveInterpretation, DirectiveType } from '../types';
import { Sparkles, CheckCircle, XCircle, Clock, ShieldAlert, Sun, BatteryLow, ZapOff, ArrowDownRight } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface InterpretationViewProps {
  interpretations: DirectiveInterpretation[] | null;
  operatorNotes: string[];
  language?: Language;
}

export const InterpretationView: React.FC<InterpretationViewProps> = ({
  interpretations,
  operatorNotes,
  language = 'en',
}) => {
  const t = translations[language];

  const getDirectiveBadge = (type: DirectiveType) => {
    switch (type) {
      case 'solar_reduction':
        return {
          label: language === 'bn' ? 'সোলার রিডাকশন' : 'Solar Reduction',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: Sun,
        };
      case 'minimum_battery_reserve':
        return {
          label: language === 'bn' ? 'ব্যাটারি রিজার্ভ ফ্লোর' : 'Battery Reserve Floor',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          icon: BatteryLow,
        };
      case 'no_charge_window':
        return {
          label: language === 'bn' ? 'চার্জিং নিষিদ্ধ উইন্ডো' : 'No Charge Window',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          icon: ZapOff,
        };
      case 'no_discharge_window':
        return {
          label: language === 'bn' ? 'ডিসচার্জিং নিষিদ্ধ উইন্ডো' : 'No Discharge Window',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
          icon: ShieldAlert,
        };
      case 'max_grid_window':
        return {
          label: language === 'bn' ? 'গ্রিড ক্যাপ উইন্ডো' : 'Grid Cap Window',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
          icon: ArrowDownRight,
        };
      case 'no_op':
      default:
        return {
          label: language === 'bn' ? 'প্রযোজ্য নয় (বাদ)' : 'No Op (Unrelated)',
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          icon: Clock,
        };
    }
  };

  const formatHours = (hours?: number[]) => {
    if (!hours || hours.length === 0) return 'None';
    return hours.map((h) => `${h.toString().padStart(2, '0')}:00`).join(', ');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{t.aiTitle}</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {t.aiBadge}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {t.aiDesc}
          </p>
        </div>
      </div>

      {!interpretations ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto opacity-30 text-emerald-500" />
          <p>{language === 'bn' ? 'অপারেটর নোট থেকে শর্তাবলী বের করতে অপটিমাইজেশন চালান।' : 'Run the optimization pipeline to extract structured directives from the operator notes.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interpretations.map((item, idx) => {
            const badge = getDirectiveBadge(item.directive_type);
            const BadgeIcon = badge.icon;
            const originalText = operatorNotes[item.note_index] || operatorNotes[idx] || '—';

            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 hover:border-emerald-500/40 transition-all"
              >
                {/* Header: Note index + Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {t.operatorNote} #{item.note_index + 1}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {item.applies ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'সক্রিয় শর্ত (Active)' : 'Active Constraint'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'প্রভাব নেই (No Impact)' : 'No Schedule Impact'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Original Note text */}
                <div className="text-xs italic text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  "{originalText}"
                </div>

                {/* Interpretation details & math */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {/* Hours */}
                  {item.structured_adjustment?.hours && (
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t.timeWindow}:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatHours(item.structured_adjustment.hours)}
                      </span>
                    </div>
                  )}

                  {/* Adjustment value */}
                  {item.structured_adjustment && (
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">{t.adjustment}:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.structured_adjustment.factor !== undefined &&
                          `Factor ${(item.structured_adjustment.factor * 100).toFixed(0)}%`}
                        {item.structured_adjustment.minimum_energy_kwh !== undefined &&
                          `Min Energy ${item.structured_adjustment.minimum_energy_kwh} kWh`}
                        {item.structured_adjustment.max_grid_kwh !== undefined &&
                          `Max Grid ${item.structured_adjustment.max_grid_kwh} kWh`}
                        {item.directive_type === 'no_charge_window' && (language === 'bn' ? 'চার্জিং ব্লকড' : 'Charging Blocked')}
                        {item.directive_type === 'no_discharge_window' && (language === 'bn' ? 'ডিসচার্জিং ব্লকড' : 'Discharging Blocked')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400 mr-1">{t.explanation}:</span>
                  {item.explanation}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
