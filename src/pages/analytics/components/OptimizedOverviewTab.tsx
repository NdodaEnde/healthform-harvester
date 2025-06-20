
import React, { Suspense } from 'react';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { Skeleton } from "@/components/ui/skeleton";
import MemoizedCard from '@/components/optimized/MemoizedCard';
import LazyChart from '@/components/optimized/LazyChart';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Shield
} from 'lucide-react';

const OptimizedOverviewTab = () => {
  const { 
    executiveSummary, 
    companyBenchmarks, 
    computedMetrics,
    loadingStates 
  } = useOptimizedAnalytics({
    enableExecutiveSummary: true,
    enableBenchmarks: true,
    enableTestResults: false, // Not needed for overview
    enableRiskAssessment: false,
    enableTrends: false,
    enablePatientHistory: false
  });

  // Prepare chart data
  const fitnessDistributionData = React.useMemo(() => {
    if (!computedMetrics?.riskDistribution) return [];
    
    return [
      { name: 'Low Risk', value: computedMetrics.riskDistribution.low, color: '#10b981' },
      { name: 'Medium Risk', value: computedMetrics.riskDistribution.medium, color: '#f59e0b' },
      { name: 'High Risk', value: computedMetrics.riskDistribution.high, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [computedMetrics]);

  const companyPerformanceData = React.useMemo(() => {
    if (!companyBenchmarks) return [];
    
    return companyBenchmarks.slice(0, 10).map(company => ({
      name: company.company_name?.substring(0, 20) + '...' || 'Unknown',
      fitness_rate: Number((company.fitness_rate || 0).toFixed(1)),
      total_employees: company.total_employees || 0
    }));
  }, [companyBenchmarks]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MemoizedCard
          title="Total Patients"
          value={executiveSummary?.total_patients?.toLocaleString() || '0'}
          description="Active patients in system"
          icon={Users}
          loading={loadingStates.executiveSummary}
        />
        
        <MemoizedCard
          title="Companies Served"
          value={executiveSummary?.total_companies?.toLocaleString() || '0'}
          description="Active client organizations"
          icon={Building2}
          loading={loadingStates.executiveSummary}
        />
        
        <MemoizedCard
          title="Health Score"
          value={`${computedMetrics?.healthScorePercentage || 0}/10`}
          description="Overall health rating"
          icon={Activity}
          badge={{
            text: computedMetrics?.healthScorePercentage >= 7 ? 'Good' : 
                  computedMetrics?.healthScorePercentage >= 5 ? 'Fair' : 'Poor',
            variant: computedMetrics?.healthScorePercentage >= 7 ? 'default' : 
                     computedMetrics?.healthScorePercentage >= 5 ? 'secondary' : 'destructive'
          }}
          loading={loadingStates.executiveSummary}
        />
        
        <MemoizedCard
          title="Completion Rate"
          value={computedMetrics?.completionRateFormatted || '0%'}
          description="Test completion rate"
          icon={CheckCircle}
          trend={{
            value: 5.2,
            isPositive: true
          }}
          loading={loadingStates.executiveSummary}
        />
      </div>

      {/* Risk Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MemoizedCard
          title="Low Risk Workers"
          value={computedMetrics?.riskDistribution.low?.toLocaleString() || '0'}
          description="Workers with low health risks"
          icon={Shield}
          badge={{ text: 'Safe', variant: 'default' }}
          loading={loadingStates.executiveSummary}
        />
        
        <MemoizedCard
          title="Medium Risk Workers"
          value={computedMetrics?.riskDistribution.medium?.toLocaleString() || '0'}
          description="Workers requiring monitoring"
          icon={Clock}
          badge={{ text: 'Monitor', variant: 'secondary' }}
          loading={loadingStates.executiveSummary}
        />
        
        <MemoizedCard
          title="High Risk Workers"
          value={computedMetrics?.riskDistribution.high?.toLocaleString() || '0'}
          description="Workers needing immediate attention"
          icon={AlertTriangle}
          badge={{ text: 'Urgent', variant: 'destructive' }}
          loading={loadingStates.executiveSummary}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <LazyChart
            type="pie"
            data={fitnessDistributionData}
            title="Risk Distribution Overview"
            height={300}
            dataKey="value"
            colors={['#10b981', '#f59e0b', '#ef4444']}
            loading={loadingStates.executiveSummary || !fitnessDistributionData.length}
          />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <LazyChart
            type="bar"
            data={companyPerformanceData}
            title="Top Company Performance"
            height={300}
            dataKey="fitness_rate"
            xAxisKey="name"
            colors={['#3b82f6']}
            loading={loadingStates.companyBenchmarks || !companyPerformanceData.length}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default OptimizedOverviewTab;
