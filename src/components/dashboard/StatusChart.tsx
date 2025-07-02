'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Sample } from '@/types';
import { SAMPLE_STATUS } from '@/lib/constants';

interface StatusChartProps {
  samples: Sample[];
}

const COLORS = {
  [SAMPLE_STATUS.PENDING]: '#fbbf24', // amber-400
  [SAMPLE_STATUS.IN_PROGRESS]: '#38bdf8', // sky-400
  [SAMPLE_STATUS.COMPLETED]: '#22c55e', // green-500
  [SAMPLE_STATUS.FAILED]: '#ef4444', // red-500
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {payload[0].name}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};


export default function StatusChart({ samples }: StatusChartProps) {
  const data = React.useMemo(() => {
    const statusCounts = samples.reduce((acc, sample) => {
      acc[sample.status] = (acc[sample.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('-', ' '), value }));
  }, [samples]);

  if (samples.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sample Status</CardTitle>
            </CardHeader>
            <CardContent className="flex h-60 items-center justify-center">
                <p className="text-muted-foreground">No sample data to display.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name.replace(' ', '-') as keyof typeof COLORS]} />
                ))}
                </Pie>
            </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center space-x-4">
            {Object.entries(COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm capitalize text-muted-foreground">{status.replace('-', ' ')}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
