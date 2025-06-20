
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { UserPlus, RotateCcw, LogOut, TrendingUp } from 'lucide-react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';

const ExaminationTypeAnalytics = () => {
  const { executiveSummary, monthlyTrends, loadingStates } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableTestResults: false,
    enableBenchmarks: false,
    enableRiskAssessment: false,
    enableTrends: true,
    enablePatientHistory: false
  });

  // Mock examination type data based on computed metrics
  const examinationTypeData = React.useMemo(() => {
    const totalExams = executiveSummary?.total_examinations || 0;
    
    return [
      {
        name: 'Pre-employment',
        value: Math.floor(totalExams * 0.45),
        icon: UserPlus,
        color: '#10b981',
        description: 'New employee screenings',
        trend: 12.5
      },
      {
        name: 'Periodical',
        value: Math.floor(totalExams * 0.50),
        icon: RotateCcw,
        color: '#3b82f6',
        description: 'Regular health check-ups',
        trend: 8.3
      },
      {
        name: 'Exit',
        value: Math.floor(totalExams * 0.05),
        icon: LogOut,
        color: '#f59e0b',
        description: 'Employee departure exams',
        trend: -2.1
      }
    ];
  }, [executiveSummary]);

  const totalExaminations = examinationTypeData.reduce((sum, item) => sum + item.value, 0);

  // Prepare monthly trends data for examination types
  const monthlyExamTrends = React.useMemo(() => {
    if (!monthlyTrends) return [];
    
    return monthlyTrends.slice(0, 6).map((trend, index) => ({
      month: new Date(trend.test_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      'Pre-employment': Math.floor((trend.test_count || 0) * 0.45),
      'Periodical': Math.floor((trend.test_count || 0) * 0.50),
      'Exit': Math.floor((trend.test_count || 0) * 0.05)
    }));
  }, [monthlyTrends]);

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
      {/* Examination Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {examinationTypeData.map((exam) => {
          const IconComponent = exam.icon;
          const percentage = totalExaminations > 0 ? ((exam.value / totalExaminations) * 100).toFixed(1) : '0';
          
          return (
            <Card key={exam.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">{exam.name}</div>
                <IconComponent className="h-4 w-4" style={{ color: exam.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{exam.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage}% of examinations
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {exam.description}
                  </Badge>
                  <div className={`text-xs flex items-center ${
                    exam.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {exam.trend > 0 ? '+' : ''}{exam.trend}%
                  </div>
                </div>
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
            <CardTitle>Examination Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={examinationTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {examinationTypeData.map((entry, index) => (
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
            <CardTitle>Examination Volume Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examinationTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {examinationTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      {monthlyExamTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Examination Type Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyExamTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="Pre-employment" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Periodical" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Exit" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExaminationTypeAnalytics;
