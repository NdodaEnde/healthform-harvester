
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Shield, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

const MedicalFitnessDeclarationChart = () => {
  const { executiveSummary, computedMetrics, loadingStates } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableTestResults: false,
    enableBenchmarks: false,
    enableRiskAssessment: false,
    enableTrends: false,
    enablePatientHistory: false
  });

  // Prepare fitness declaration data from computed metrics
  const fitnessDeclarationData = React.useMemo(() => {
    if (!computedMetrics?.riskDistribution) return [];
    
    return [
      { 
        name: 'Fit', 
        value: computedMetrics.riskDistribution.low || 0, 
        color: '#10b981',
        icon: CheckCircle,
        description: 'No restrictions required'
      },
      { 
        name: 'Fit with Restrictions', 
        value: Math.floor((computedMetrics.riskDistribution.medium || 0) * 0.6), 
        color: '#f59e0b',
        icon: Shield,
        description: 'Limited work activities'
      },
      { 
        name: 'Fit with Condition', 
        value: Math.floor((computedMetrics.riskDistribution.medium || 0) * 0.4), 
        color: '#3b82f6',
        icon: AlertTriangle,
        description: 'Conditional fitness'
      },
      { 
        name: 'Temporarily Unfit', 
        value: Math.floor((computedMetrics.riskDistribution.high || 0) * 0.3), 
        color: '#ef4444',
        icon: Clock,
        description: 'Temporary unfitness'
      },
      { 
        name: 'Unfit', 
        value: Math.floor((computedMetrics.riskDistribution.high || 0) * 0.7), 
        color: '#dc2626',
        icon: XCircle,
        description: 'Permanent unfitness'
      }
    ].filter(item => item.value > 0);
  }, [computedMetrics]);

  const totalDeclarations = fitnessDeclarationData.reduce((sum, item) => sum + item.value, 0);

  if (loadingStates.executiveSummary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fitness Declaration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {fitnessDeclarationData.map((item) => {
          const IconComponent = item.icon;
          const percentage = totalDeclarations > 0 ? ((item.value / totalDeclarations) * 100).toFixed(1) : '0';
          
          return (
            <Card key={item.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{item.name}</div>
                <IconComponent className="h-4 w-4" style={{ color: item.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage}% of total
                </div>
                <Badge 
                  variant="outline" 
                  className="mt-2 text-xs"
                  style={{ borderColor: item.color, color: item.color }}
                >
                  {item.description}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Fitness Declaration Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fitnessDeclarationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {fitnessDeclarationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fitness Status Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fitnessDeclarationData}>
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
                  {fitnessDeclarationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MedicalFitnessDeclarationChart;
