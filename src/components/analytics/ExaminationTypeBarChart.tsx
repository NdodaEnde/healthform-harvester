
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface ExaminationTypeBarChartProps {
  data: {
    preEmployment: number;
    periodical: number;
    exit: number;
  };
}

const ExaminationTypeBarChart: React.FC<ExaminationTypeBarChartProps> = ({ data }) => {
  const chartData = [
    {
      name: 'Pre-employment',
      value: data.preEmployment,
      fill: '#3b82f6'
    },
    {
      name: 'Periodical',
      value: data.periodical,
      fill: '#10b981'
    },
    {
      name: 'Exit',
      value: data.exit,
      fill: '#f59e0b'
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
        <CardTitle className="text-base font-medium">Examination Type Distribution</CardTitle>
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

export default ExaminationTypeBarChart;
