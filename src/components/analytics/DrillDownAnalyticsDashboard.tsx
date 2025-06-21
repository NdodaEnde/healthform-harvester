
import React from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { usePackage } from '@/contexts/PackageContext';
import InteractiveChart from './InteractiveChart';
import FeatureSkeleton from '@/components/FeatureSkeleton';
import { Card, CardContent } from '@/components/ui/card';

const DrillDownAnalyticsDashboard: React.FC = () => {
  const { isPremium, isEnterprise } = usePackage();
  const { 
    testResultsSummary,
    monthlyTrends,
    riskAssessment,
    companyBenchmarks,
    isLoading 
  } = useOptimizedAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FeatureSkeleton type="chart" className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureSkeleton type="chart" className="h-64" />
          <FeatureSkeleton type="chart" className="h-64" />
        </div>
      </div>
    );
  }

  if (!isPremium && !isEnterprise) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Interactive drill-down analytics are available with Premium subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare test results data with drill-down levels
  const testResultsData = testResultsSummary?.slice(0, 10).map(result => ({
    name: result.test_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
    total: result.total_tests || 0,
    completed: result.completed_tests || 0,
    abnormal: result.abnormal_count || 0,
    completionRate: Math.round(result.completion_rate || 0),
    testType: result.test_type
  })) || [];

  // Company performance data
  const companyData = companyBenchmarks?.slice(0, 8).map(company => ({
    name: company.company_name || 'Unknown',
    fitnessRate: Math.round(company.fitness_rate || 0),
    totalTests: company.total_tests || 0,
    employees: company.employee_count || 0
  })) || [];

  // Monthly trends data
  const trendsData = monthlyTrends?.slice(-12).map(trend => ({
    month: new Date(trend.test_month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    tests: trend.test_count || 0,
    completion: Math.round(trend.completion_rate || 0),
    abnormal: Math.round(trend.abnormal_rate || 0),
    rawDate: trend.test_month
  })) || [];

  // Risk assessment data
  const riskData = riskAssessment?.reduce((acc, item) => {
    const riskLevel = item.risk_level?.toLowerCase() || 'low';
    const key = riskLevel.includes('high') ? 'High Risk' : 
                riskLevel.includes('medium') ? 'Medium Risk' : 'Low Risk';
    
    const existing = acc.find(r => r.name === key);
    if (existing) {
      existing.value += item.test_count || 0;
    } else {
      acc.push({ name: key, value: item.test_count || 0 });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>) || [];

  // Define drill-down levels for test results
  const testResultsDrillDown = [
    {
      id: 'completion-details',
      title: 'Test Completion Analysis',
      data: testResultsData.map(item => ({
        name: item.name,
        completed: item.completed,
        pending: item.total - item.completed,
        rate: item.completionRate
      })),
      type: 'bar' as const,
      dataKey: 'completed',
      nameKey: 'name'
    }
  ];

  // Define drill-down levels for company performance
  const companyDrillDown = [
    {
      id: 'employee-breakdown',
      title: 'Employee Health Breakdown',
      data: companyData.map(company => ({
        name: company.name,
        employees: company.employees,
        testsPerEmployee: company.totalTests > 0 ? Math.round(company.totalTests / company.employees) : 0,
        fitnessRate: company.fitnessRate
      })),
      type: 'bar' as const,
      dataKey: 'employees',
      nameKey: 'name'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Test Results Interactive Chart */}
      <InteractiveChart
        title="Test Results Overview"
        initialData={testResultsData}
        drillDownLevels={testResultsDrillDown}
        type="bar"
        dataKey="total"
        nameKey="name"
        colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Performance Chart */}
        <InteractiveChart
          title="Company Performance"
          initialData={companyData}
          drillDownLevels={companyDrillDown}
          type="bar"
          dataKey="fitnessRate"
          nameKey="name"
          colors={['#10b981', '#3b82f6', '#f59e0b']}
        />

        {/* Risk Distribution Chart */}
        <InteractiveChart
          title="Risk Distribution"
          initialData={riskData}
          type="pie"
          dataKey="value"
          nameKey="name"
          colors={['#10b981', '#f59e0b', '#ef4444']}
        />
      </div>

      {/* Monthly Trends Chart */}
      {isEnterprise && (
        <InteractiveChart
          title="Monthly Health Trends (Enterprise)"
          initialData={trendsData}
          type="line"
          dataKey="tests"
          nameKey="month"
          colors={['#8b5cf6', '#3b82f6', '#10b981']}
        />
      )}
    </div>
  );
};

export default DrillDownAnalyticsDashboard;
