import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { OptimizeResponse, HourData } from '../types';

interface EnergyChartProps {
  response: OptimizeResponse | null;
  hours: HourData[];
}

export const EnergyChart: React.FC<EnergyChartProps> = ({ response, hours }) => {
  const chartData = hours.map((h, idx) => {
    const plan = response?.hourly_plan[idx];
    const batteryNet = plan ? plan.battery_charge_kwh - plan.battery_discharge_kwh : 0;

    return {
      hour: `${h.hour.toString().padStart(2, '0')}:00`,
      Demand: h.demand_kwh,
      'Solar Forecast': h.solar_kwh,
      'Solar Used': plan ? plan.solar_used_kwh : undefined,
      'Grid Import': plan ? plan.grid_kwh : undefined,
      'Battery Net': plan ? batteryNet : undefined,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            24-Hour Energy Dispatch Profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hourly balance between campus demand, rooftop solar, battery actions, and grid imports.
          </p>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
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
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="Demand"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Demand"
            />
            <Line
              type="monotone"
              dataKey="Solar Forecast"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              name="Solar Forecast"
            />
            {response && (
              <>
                <Line
                  type="monotone"
                  dataKey="Solar Used"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Solar Used"
                />
                <Line
                  type="monotone"
                  dataKey="Grid Import"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  name="Grid Import"
                />
                <Line
                  type="monotone"
                  dataKey="Battery Net"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Battery Net (Chg - Disch)"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
