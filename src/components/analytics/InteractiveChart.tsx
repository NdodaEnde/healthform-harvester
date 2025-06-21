
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ArrowLeft, Drill, TrendingUp, Users, Building2 } from 'lucide-react';

interface DrillDownLevel {
  id: string;
  title: string;
  data: any[];
  type: 'bar' | 'pie' | 'line';
  dataKey: string;
  nameKey: string;
  colors?: string[];
}

interface InteractiveChartProps {
  title: string;
  initialData: any[];
  drillDownLevels?: DrillDownLevel[];
  type: 'bar' | 'pie' | 'line';
  dataKey: string;
  nameKey: string;
  colors?: string[];
  onDrillDown?: (item: any) => void;
  className?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  initialData,
  drillDownLevels = [],
  type,
  dataKey,
  nameKey,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  onDrillDown,
  className
}) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const currentData = useMemo(() => {
    if (currentLevel === 0) return initialData;
    if (drillDownLevels[currentLevel - 1]) {
      return drillDownLevels[currentLevel - 1].data;
    }
    return initialData;
  }, [currentLevel, initialData, drillDownLevels]);

  const currentConfig = useMemo(() => {
    if (currentLevel === 0) {
      return { type, dataKey, nameKey, title };
    }
    const level = drillDownLevels[currentLevel - 1];
    return {
      type: level.type,
      dataKey: level.dataKey,
      nameKey: level.nameKey,
      title: level.title
    };
  }, [currentLevel, type, dataKey, nameKey, title, drillDownLevels]);

  const handleItemClick = (item: any, index: number) => {
    if (currentLevel >= drillDownLevels.length) return;
    
    setSelectedItem(item);
    setCurrentLevel(prev => prev + 1);
    
    if (onDrillDown) {
      onDrillDown(item);
    }
  };

  const handleGoBack = () => {
    if (currentLevel > 0) {
      setCurrentLevel(prev => prev - 1);
      setSelectedItem(null);
    }
  };

  const renderChart = () => {
    const config = currentConfig;
    
    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.nameKey} 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey={config.dataKey} 
                fill={colors[0]}
                cursor="pointer"
                onClick={handleItemClick}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey={config.dataKey}
                onClick={handleItemClick}
                cursor="pointer"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {currentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.nameKey} />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={config.dataKey} 
                stroke={colors[0]} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentLevel > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <CardTitle className="flex items-center gap-2">
              <Drill className="h-5 w-5" />
              {currentConfig.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Level {currentLevel + 1}
            </Badge>
            {currentLevel < drillDownLevels.length && (
              <Badge variant="secondary" className="text-xs">
                <Drill className="h-3 w-3 mr-1" />
                Drill-down Available
              </Badge>
            )}
          </div>
        </div>
        {selectedItem && (
          <p className="text-sm text-muted-foreground">
            Viewing details for: <span className="font-medium">{selectedItem[nameKey]}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {currentData.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for this view
          </div>
        )}
        
        {currentLevel < drillDownLevels.length && type !== 'line' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              💡 Click on any chart element to drill down for more detailed insights
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
