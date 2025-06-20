
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { 
  Mountain, 
  Wind, 
  Truck, 
  Headphones, 
  Home, 
  FlaskConical, 
  Glasses, 
  Heart 
} from 'lucide-react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

const EnhancedRestrictionsAnalytics = () => {
  const { executiveSummary, computedMetrics, loadingStates } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableTestResults: false,
    enableBenchmarks: false,
    enableRiskAssessment: false,
    enableTrends: false,
    enablePatientHistory: false
  });

  // Mock restrictions data based on computed metrics
  const restrictionsData = React.useMemo(() => {
    const baseValue = computedMetrics?.riskDistribution.medium || 0;
    const highRisk = computedMetrics?.riskDistribution.high || 0;
    
    return [
      {
        name: 'Heights',
        value: Math.floor(baseValue * 0.25),
        icon: Mountain,
        color: '#ef4444',
        description: 'Working at heights restriction',
        severity: 'high'
      },
      {
        name: 'Dust Exposure',
        value: Math.floor(baseValue * 0.18),
        icon: Wind,
        color: '#f59e0b',
        description: 'Dust exposure limitation',
        severity: 'medium'
      },
      {
        name: 'Motorized Equipment',
        value: Math.floor(baseValue * 0.15),
        icon: Truck,
        color: '#3b82f6',
        description: 'Motorized equipment restriction',
        severity: 'medium'
      },
      {
        name: 'Hearing Protection',
        value: Math.floor(baseValue * 0.22),
        icon: Headphones,
        color: '#10b981',
        description: 'Must wear hearing protection',
        severity: 'low'
      },
      {
        name: 'Confined Spaces',
        value: Math.floor(highRisk * 0.4),
        icon: Home,
        color: '#dc2626',
        description: 'Confined spaces restriction',
        severity: 'high'
      },
      {
        name: 'Chemical Exposure',
        value: Math.floor(baseValue * 0.12),
        icon: FlaskConical,
        color: '#f59e0b',
        description: 'Chemical exposure limitation',
        severity: 'medium'
      },
      {
        name: 'Vision Correction',
        value: Math.floor(baseValue * 0.35),
        icon: Glasses,
        color: '#6366f1',
        description: 'Must wear spectacles',
        severity: 'low'
      },
      {
        name: 'Medical Treatment',
        value: Math.floor(highRisk * 0.6),
        icon: Heart,
        color: '#ec4899',
        description: 'Continue chronic treatment',
        severity: 'medium'
      }
    ].filter(item => item.value > 0);
  }, [computedMetrics]);

  const totalRestrictions = restrictionsData.reduce((sum, item) => sum + item.value, 0);
  const totalWorkers = executiveSummary?.total_patients || 1;

  if (loadingStates.executiveSummary) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Restrictions</div>
            <Mountain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestrictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((totalRestrictions / totalWorkers) * 100).toFixed(1)}% of workers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">High Severity</div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restrictionsData.filter(r => r.severity === 'high').reduce((sum, r) => sum + r.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Critical restrictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Medium Severity</div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restrictionsData.filter(r => r.severity === 'medium').reduce((sum, r) => sum + r.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Moderate restrictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Low Severity</div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {restrictionsData.filter(r => r.severity === 'low').reduce((sum, r) => sum + r.value, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Minor restrictions</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Restrictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restrictionsData.map((restriction) => {
          const IconComponent = restriction.icon;
          const percentage = totalRestrictions > 0 ? (restriction.value / totalRestrictions) * 100 : 0;
          
          return (
            <Card key={restriction.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{restriction.name}</div>
                <IconComponent className="h-4 w-4" style={{ color: restriction.color }} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{restriction.value}</span>
                  <Badge 
                    variant={restriction.severity === 'high' ? 'destructive' : 
                            restriction.severity === 'medium' ? 'secondary' : 'default'}
                  >
                    {restriction.severity}
                  </Badge>
                </div>
                <Progress value={percentage} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {restriction.description} ({percentage.toFixed(1)}%)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Restrictions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={restrictionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {restrictionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restrictions Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={restrictionsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {restrictionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedRestrictionsAnalytics;
