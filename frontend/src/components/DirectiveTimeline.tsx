import React from 'react';
import { DirectiveInterpretation } from '../types';
import { Clock } from 'lucide-react';

interface DirectiveTimelineProps {
  interpretations: DirectiveInterpretation[] | null;
}

export const DirectiveTimeline: React.FC<DirectiveTimelineProps> = ({ interpretations }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activeDirectives = interpretations?.filter((d) => d.applies) || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>24-Hour Constraint Timeline</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Temporal distribution of active operational restrictions across the day.
          </p>
        </div>
      </div>

      {activeDirectives.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
          {interpretations
            ? 'No active operational restrictions applied to today’s schedule.'
            : 'Run optimization to visualize directive time windows.'}
        </div>
      ) : (
        <div className="space-y-3 overflow-x-auto">
          {/* Hours header */}
          <div className="min-w-[600px] flex items-center text-[10px] font-mono text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="w-44 flex-shrink-0 font-sans font-medium text-slate-500">Constraint Type</div>
            <div className="flex-1 grid grid-cols-24 gap-0.5 text-center">
              {hours.map((h) => (
                <div key={h} className={h % 3 === 0 ? 'font-bold text-slate-600 dark:text-slate-300' : 'text-slate-400'}>
                  {h % 3 === 0 ? h : '·'}
                </div>
              ))}
            </div>
          </div>

          {/* Directive rows */}
          <div className="min-w-[600px] space-y-2">
            {activeDirectives.map((item, idx) => {
              const activeHours = new Set(item.structured_adjustment?.hours || []);
              let label = item.directive_type.replace(/_/g, ' ');
              let barColor = 'bg-slate-500';

              if (item.directive_type === 'solar_reduction') {
                label = `Solar Curtailment (${((item.structured_adjustment?.factor ?? 0) * 100).toFixed(0)}%)`;
                barColor = 'bg-amber-500';
              } else if (item.directive_type === 'minimum_battery_reserve') {
                label = `Reserve ≥ ${item.structured_adjustment?.minimum_energy_kwh} kWh`;
                barColor = 'bg-purple-500';
              } else if (item.directive_type === 'no_charge_window') {
                label = 'Charge Prohibited';
                barColor = 'bg-rose-500';
              } else if (item.directive_type === 'no_discharge_window') {
                label = 'Discharge Prohibited';
                barColor = 'bg-indigo-500';
              } else if (item.directive_type === 'max_grid_window') {
                label = `Grid Cap ≤ ${item.structured_adjustment?.max_grid_kwh} kWh`;
                barColor = 'bg-blue-500';
              }

              return (
                <div key={idx} className="flex items-center text-xs">
                  <div className="w-44 flex-shrink-0 text-slate-700 dark:text-slate-300 font-medium truncate pr-2" title={label}>
                    {label}
                  </div>
                  <div className="flex-1 grid grid-cols-24 gap-0.5 h-6 bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                    {hours.map((h) => {
                      const isActive = activeHours.has(h);
                      return (
                        <div
                          key={h}
                          className={`rounded-sm transition-all ${
                            isActive
                              ? `${barColor} shadow-sm`
                              : 'bg-transparent'
                          }`}
                          title={isActive ? `Hour ${h}:00 - Active` : `Hour ${h}:00 - Inactive`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
