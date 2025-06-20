
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { AlertTriangle, Shield, TrendingUp, Users, Eye, Ear, Lungs, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RiskAnalysisDashboard = () => {
  const { riskAssessment, executiveSummary, isLoading } = useEnhancedAnalytics();

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

  // Calculate risk metrics
  const riskMetrics = React.useMemo(() => {
    if (!riskAssessment || !executiveSummary) return null;

    const totalTests = executiveSummary.total_tests_conducted || 0;
    const highRisk = executiveSummary.high_risk_results || 0;
    const mediumRisk = executiveSummary.medium_risk_results || 0;
    const lowRisk = executiveSummary.low_risk_results || 0;

    return {
      totalTests,
      highRisk,
      mediumRisk,
      lowRisk,
      riskDistribution: [
        { name: 'High Risk', value: highRisk, color: '#ef4444' },
        { name: 'Medium Risk', value: mediumRisk, color: '#f59e0b' },
        { name: 'Low Risk', value: lowRisk, color: '#10b981' },
      ],
      riskPercentage: totalTests > 0 ? ((highRisk + mediumRisk) / totalTests * 100).toFixed(1) : '0'
    };
  }, [riskAssessment, executiveSummary]);

  // Process risk by test type
  const riskByTestType = React.useMemo(() => {
    if (!riskAssessment) return [];

    const testTypeRisks = riskAssessment.reduce((acc, item) => {
      const testType = item.test_type || 'Unknown';
      const riskLevel = item.risk_level || 'Low';
      const count = item.test_count || 0;

      if (!acc[testType]) {
        acc[testType] = { testType, High: 0, Medium: 0, Low: 0, total: 0 };
      }

      acc[testType][riskLevel] += count;
      acc[testType].total += count;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(testTypeRisks).sort((a: any, b: any) => b.total - a.total);
  }, [riskAssessment]);

  const getTestTypeIcon = (testType: string) => {
    const type = testType.toLowerCase();
    if (type.includes('vision') || type.includes('eye')) return Eye;
    if (type.includes('hearing') || type.includes('audio')) return Ear;
    if (type.includes('lung') || type.includes('respiratory')) return Lungs;
    return Activity;
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!riskMetrics) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800">No risk assessment data available. Complete medical examinations to see risk analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">High Risk Cases</p>
                <p className="text-2xl font-bold text-red-700">{riskMetrics.highRisk}</p>
              </div>
              <div className="p-2 bg-red-200 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Medium Risk</p>
                <p className="text-2xl font-bold text-amber-700">{riskMetrics.mediumRisk}</p>
              </div>
              <div className="p-2 bg-amber-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Low Risk</p>
                <p className="text-2xl font-bold text-green-700">{riskMetrics.lowRisk}</p>
              </div>
              <div className="p-2 bg-green-200 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Overall Risk %</p>
                <p className="text-2xl font-bold text-blue-700">{riskMetrics.riskPercentage}%</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Risk Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskMetrics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskMetrics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk by Test Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Risk by Test Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskByTestType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="testType" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="High" stackId="a" fill="#ef4444" />
                <Bar dataKey="Medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Low" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Assessment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskAssessment?.slice(0, 10).map((item, index) => {
              const IconComponent = getTestTypeIcon(item.test_type || '');
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.test_type}</p>
                      <p className="text-sm text-gray-600">
                        {item.company_name} - {item.job_title}
                      </p>
                      {item.risk_explanation && (
                        <p className="text-xs text-gray-500 mt-1">{item.risk_explanation}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getRiskColor(item.risk_level || '')}>
                      {item.risk_level || 'Unknown'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {item.test_count} tests
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAnalysisDashboard;
