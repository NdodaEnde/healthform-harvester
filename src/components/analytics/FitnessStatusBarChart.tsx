
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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
          className="min-h-[200px] w-full"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <ChartTooltip
                content={<ChartTooltipContent />}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default FitnessStatusBarChart;
