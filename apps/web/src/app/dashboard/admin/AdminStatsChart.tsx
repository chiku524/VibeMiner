'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';

type Stats = { users: number; network_listings: number };

const COLORS = ['#22d3ee', '#34d399'];

export function AdminStatsChart({ stats }: { stats: Stats }) {
  const data = [
    { name: 'Users', value: stats.users, fill: COLORS[0] },
    { name: 'Listings', value: stats.network_listings, fill: COLORS[1] },
  ];
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'rgb(156 163 175)', fontSize: 12 }}
            axisLine={{ stroke: 'rgb(255 255 255 / 0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgb(156 163 175)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(17 24 39)',
              border: '1px solid rgb(255 255 255 / 0.1)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'rgb(209 213 219)' }}
            formatter={(value) => [value ?? 0, 'Count']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
