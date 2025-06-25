
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface FitnessStatusBarChartProps {
  data: {
    fit: number;
    fitWithRestriction: number;
    fitWithCondition: number;
    temporaryUnfit: number;
    unfit: number;
    total: number;
  };
}

const FitnessStatusBarChart: React.FC<FitnessStatusBarChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Fit',
      value: data.fit,
      fill: '#10b981'
    },
    {
      name: 'Fit with Restriction',
      value: data.fitWithRestriction,
      fill: '#f59e0b'
    },
    {
      name: 'Fit with Condition',
      value: data.fitWithCondition,
      fill: '#f97316'
    },
    {
      name: 'Temporary Unfit',
      value: data.temporaryUnfit,
      fill: '#f59e0b'
    },
    {
      name: 'Unfit',
      value: data.unfit,
      fill: '#ef4444'
    }
  ].filter(item => item.value > 0);

  const chartConfig = {
    value: {
      label: "Count"
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Fitness Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="min-h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default FitnessStatusBarChart;
