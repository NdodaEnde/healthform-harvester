
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, Target, BarChart3, Activity, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';

const PredictiveAnalyticsDashboard = () => {
  const { monthlyTrends, executiveSummary, isLoading } = useEnhancedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Process monthly trends for predictive analysis
  const trendData = React.useMemo(() => {
    if (!monthlyTrends || monthlyTrends.length === 0) return [];

    // Group by test type and month
    const groupedData = monthlyTrends.reduce((acc, item) => {
      const monthKey = new Date(item.test_month).toISOString().substring(0, 7);
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          monthLabel: new Date(item.test_month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          totalTests: 0,
          completedTests: 0,
          abnormalTests: 0,
          uniquePatients: 0,
          vision: 0,
          hearing: 0,
          lung: 0,
          heights: 0,
          drug: 0
        };
      }

      acc[monthKey].totalTests += item.test_count || 0;
      acc[monthKey].completedTests += item.completed_count || 0;
      acc[monthKey].abnormalTests += item.abnormal_count || 0;
      acc[monthKey].uniquePatients += item.unique_patients_tested || 0;

      // Categorize test types
      const testType = item.test_type?.toLowerCase() || '';
      if (testType.includes('vision') || testType.includes('eye')) {
        acc[monthKey].vision += item.test_count || 0;
      } else if (testType.includes('hearing') || testType.includes('audio')) {
        acc[monthKey].hearing += item.test_count || 0;
      } else if (testType.includes('lung') || testType.includes('respiratory')) {
        acc[monthKey].lung += item.test_count || 0;
      } else if (testType.includes('heights') || testType.includes('working')) {
        acc[monthKey].heights += item.test_count || 0;
      } else if (testType.includes('drug')) {
        acc[monthKey].drug += item.test_count || 0;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedData)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((item: any) => ({
        ...item,
        completionRate: item.totalTests > 0 ? ((item.completedTests / item.totalTests) * 100).toFixed(1) : 0,
        abnormalRate: item.completedTests > 0 ? ((item.abnormalTests / item.completedTests) * 100).toFixed(1) : 0
      }));
  }, [monthlyTrends]);

  // Calculate trend predictions
  const predictions = React.useMemo(() => {
    if (trendData.length < 3) return null;

    const last3Months = trendData.slice(-3);
    const avgMonthlyTests = last3Months.reduce((sum, item) => sum + item.totalTests, 0) / 3;
    const avgCompletionRate = last3Months.reduce((sum, item) => sum + parseFloat(item.completionRate), 0) / 3;
    const avgAbnormalRate = last3Months.reduce((sum, item) => sum + parseFloat(item.abnormalRate), 0) / 3;

    // Simple trend calculation
    const recentTrend = last3Months[2].totalTests - last3Months[0].totalTests;
    const trendDirection = recentTrend > 0 ? 'increasing' : recentTrend < 0 ? 'decreasing' : 'stable';

    return {
      nextMonthPrediction: Math.round(avgMonthlyTests + (recentTrend / 2)),
      avgCompletionRate: avgCompletionRate.toFixed(1),
      avgAbnormalRate: avgAbnormalRate.toFixed(1),
      trendDirection,
      trendPercentage: Math.abs((recentTrend / last3Months[0].totalTests) * 100).toFixed(1)
    };
  }, [trendData]);

  // Generate forecast data
  const forecastData = React.useMemo(() => {
    if (trendData.length === 0) return [];

    const forecast = [...trendData];
    const lastMonth = trendData[trendData.length - 1];
    
    // Generate 3 months of forecast
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(lastMonth.month);
      futureDate.setMonth(futureDate.getMonth() + i);
      
      const forecastValue = predictions ? 
        Math.round(lastMonth.totalTests * (1 + (parseFloat(predictions.trendPercentage) / 100) * (predictions.trendDirection === 'increasing' ? 1 : -1))) :
        lastMonth.totalTests;

      forecast.push({
        month: futureDate.toISOString().substring(0, 7),
        monthLabel: futureDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        totalTests: forecastValue,
        isForecast: true,
        completionRate: predictions?.avgCompletionRate || lastMonth.completionRate,
        abnormalRate: predictions?.avgAbnormalRate || lastMonth.abnormalRate
      });
    }

    return forecast;
  }, [trendData, predictions]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Activity;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing': return 'text-green-600 bg-green-50 border-green-200';
      case 'decreasing': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!predictions) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">Insufficient data for predictive analysis. At least 3 months of data required.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prediction Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Next Month Forecast</p>
                <p className="text-2xl font-bold text-blue-700">{predictions.nextMonthPrediction}</p>
                <p className="text-xs text-blue-600">Estimated Tests</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 bg-gradient-to-br ${predictions.trendDirection === 'increasing' ? 'from-green-50 to-green-100 border-green-200' : predictions.trendDirection === 'decreasing' ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${predictions.trendDirection === 'increasing' ? 'text-green-600' : predictions.trendDirection === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                  Volume Trend
                </p>
                <p className={`text-2xl font-bold ${predictions.trendDirection === 'increasing' ? 'text-green-700' : predictions.trendDirection === 'decreasing' ? 'text-red-700' : 'text-gray-700'}`}>
                  {predictions.trendPercentage}%
                </p>
                <p className={`text-xs ${predictions.trendDirection === 'increasing' ? 'text-green-600' : predictions.trendDirection === 'decreasing' ? 'text-red-600' : 'text-gray-600'}`}>
                  {predictions.trendDirection}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${predictions.trendDirection === 'increasing' ? 'bg-green-200' : predictions.trendDirection === 'decreasing' ? 'bg-red-200' : 'bg-gray-200'}`}>
                {React.createElement(getTrendIcon(predictions.trendDirection), { 
                  className: `h-6 w-6 ${predictions.trendDirection === 'increasing' ? 'text-green-600' : predictions.trendDirection === 'decreasing' ? 'text-red-600' : 'text-gray-600'}` 
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Avg Completion</p>
                <p className="text-2xl font-bold text-purple-700">{predictions.avgCompletionRate}%</p>
                <p className="text-xs text-purple-600">3-Month Average</p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Risk Rate Trend</p>
                <p className="text-2xl font-bold text-orange-700">{predictions.avgAbnormalRate}%</p>
                <p className="text-xs text-orange-600">Abnormal Results</p>
              </div>
              <div className="p-2 bg-orange-200 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Trends with Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Test Volume Trends & Forecast</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value : value,
                    name === 'totalTests' ? 'Total Tests' : String(name)
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalTests" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.1}
                  name="Total Tests"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalTests" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props;
                    return payload?.isForecast ? 
                      <circle {...props} fill="#f59e0b" stroke="#f59e0b" r={4} strokeDasharray="5,5" /> :
                      <circle {...props} fill="#3b82f6" stroke="#3b82f6" r={3} />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Type Distribution Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Test Type Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="vision" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Vision Tests" />
                <Area type="monotone" dataKey="hearing" stackId="1" stroke="#10b981" fill="#10b981" name="Hearing Tests" />
                <Area type="monotone" dataKey="lung" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Lung Function" />
                <Area type="monotone" dataKey="heights" stackId="1" stroke="#ef4444" fill="#ef4444" name="Heights Tests" />
                <Area type="monotone" dataKey="drug" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Drug Screens" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quality Metrics Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Quality Metrics & Predictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthLabel" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}${String(name).includes('Rate') ? '%' : ''}`,
                  String(name) === 'completionRate' ? 'Completion Rate' :
                  String(name) === 'abnormalRate' ? 'Abnormal Rate' :
                  String(name) === 'uniquePatients' ? 'Unique Patients' : String(name)
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="uniquePatients" fill="#6b7280" name="Unique Patients" />
              <Line yAxisId="right" type="monotone" dataKey="completionRate" stroke="#10b981" strokeWidth={2} name="Completion Rate %" />
              <Line yAxisId="right" type="monotone" dataKey="abnormalRate" stroke="#ef4444" strokeWidth={2} name="Abnormal Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Prediction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Predictive Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Badge className={getTrendColor(predictions.trendDirection)}>
                  {predictions.trendDirection.charAt(0).toUpperCase() + predictions.trendDirection.slice(1)} Trend
                </Badge>
                <span className="text-sm text-gray-600">
                  {predictions.trendPercentage}% change detected
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Key Predictions:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Expected {predictions.nextMonthPrediction} tests next month</li>
                  <li>Completion rate trending at {predictions.avgCompletionRate}%</li>
                  <li>Risk rate averaging {predictions.avgAbnormalRate}%</li>
                  <li>Volume trend is {predictions.trendDirection} by {predictions.trendPercentage}%</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {predictions.trendDirection === 'increasing' && (
                  <>
                    <li>Prepare for increased testing capacity</li>
                    <li>Consider additional staffing resources</li>
                  </>
                )}
                {predictions.trendDirection === 'decreasing' && (
                  <>
                    <li>Investigate reasons for declining volume</li>
                    <li>Review client engagement strategies</li>
                  </>
                )}
                {parseFloat(predictions.avgAbnormalRate) > 15 && (
                  <li>Focus on preventive health measures</li>
                )}
                {parseFloat(predictions.avgCompletionRate) < 85 && (
                  <li>Improve test completion follow-up processes</li>
                )}
                <li>Monitor trends monthly for early intervention</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
