import React from 'react';
import { Activity, ShieldCheck, Cpu, Sun, Zap, BatteryCharging, Sparkles } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { OptimizeResponse, HourData, HealthState } from '../types';

interface SystemHealthPanelProps {
  language: Language;
  healthStatus: HealthState;
  response: OptimizeResponse | null;
  hours: HourData[];
  isOptimizing: boolean;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  language,
  healthStatus,
  response,
  hours,
  isOptimizing,
}) => {
  const t = translations[language];

  const totalSolar = hours.reduce((sum, h) => sum + h.solar_kwh, 0);
  const isSolarGenerating = totalSolar > 0;
  const isBatteryActive = response ? response.hourly_plan.some((p) => p.battery_action !== 'idle') : false;

  const healthItems = [
    {
      id: 'grid',
      name: t.gridHealth,
      status: healthStatus === 'online' ? (language === 'bn' ? 'অনলাইন (স্বাভাবিক)' : 'Online') : (language === 'bn' ? 'অফলাইন' : 'Offline'),
      icon: Zap,
      dotColor: healthStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500',
      badge: '230V / 50Hz',
    },
    {
      id: 'solar',
      name: t.solarHealth,
      status: isSolarGenerating ? (language === 'bn' ? 'উৎপাদনরত' : 'Generating') : (language === 'bn' ? 'স্ট্যান্ডবাই' : 'Standby'),
      icon: Sun,
      dotColor: isSolarGenerating ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500',
      badge: `${totalSolar.toFixed(0)} kWh`,
    },
    {
      id: 'battery',
      name: t.batteryHealth,
      status: isBatteryActive ? (language === 'bn' ? 'সক্রিয় চার্জ/ডিসচার্জ' : 'Active Cycling') : (language === 'bn' ? 'স্ট্যান্ডবাই' : 'Ready'),
      icon: BatteryCharging,
      dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      badge: 'BESS 90%',
    },
    {
      id: 'optimizer',
      name: t.optimizerHealth,
      status: isOptimizing ? (language === 'bn' ? 'সমাধান করছে...' : 'Solving...') : (language === 'bn' ? 'প্রস্তুত (অপটিমাল)' : 'Ready'),
      icon: Cpu,
      dotColor: isOptimizing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      badge: 'PuLP CBC',
    },
    {
      id: 'llm',
      name: t.llmHealth,
      status: healthStatus === 'online' ? (language === 'bn' ? 'প্রস্তুত (মাল্টি-কি)' : 'Ready (Multi-Key)') : (language === 'bn' ? 'সংযোগহীন' : 'Disconnected'),
      icon: Sparkles,
      dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      badge: 'Gemini 2.5',
    },
  ];

  return (
    <div className="enterprise-card bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {t.systemHealthTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t.systemHealthSubtitle}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" />
          100% HEALTHY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {healthItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 hover:bg-slate-100/60 dark:hover:bg-slate-800/90 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  {item.name}
                </span>
                <span className={`w-2 h-2 rounded-full ${item.dotColor} animate-pulse`} />
              </div>

              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {item.status}
                </span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                {item.badge}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
