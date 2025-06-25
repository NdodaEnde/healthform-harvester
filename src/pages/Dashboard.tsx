import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Activity,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Brain,
  Shield,
  Building2,
  Target
} from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { usePremiumDashboardMetrics } from '@/hooks/usePremiumDashboardMetrics';
import { usePackage } from '@/contexts/PackageContext';
import { DocumentProcessingTrends } from '@/components/dashboard/DocumentProcessingTrends';
import { RecentDocuments } from '@/components/dashboard/RecentDocuments';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import TaskWidget from '@/components/tasks/TaskWidget';

export default function Dashboard() {
  const { currentTier, isPremium, isEnterprise } = usePackage();
  const {
    totalActiveEmployees,
    complianceRate,
    certificatesExpiring,
    testsThisMonth,
    testsLastMonth,
    pendingReviews,
    systemHealth,
    missingRecords,
    loading,
    error,
    refreshMetrics
  } = useDashboardMetrics();

  const {
    healthIntelligenceScore,
    activeRiskAlerts,
    departmentsTracked,
    predictionAccuracy,
    loading: premiumLoading,
    refreshMetrics: refreshPremiumMetrics
  } = usePremiumDashboardMetrics();

  // Calculate month-over-month change
  const monthOverMonthChange = testsThisMonth - testsLastMonth;

  const handleRefresh = () => {
    refreshMetrics();
    if (isPremium || isEnterprise) {
      refreshPremiumMetrics();
    }
  };

  const isLoading = loading || (isPremium || isEnterprise ? premiumLoading : false);

  if (error) {
    console.error('Dashboard metrics error:', error);
  }

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Overview</h1>
          <p className="text-muted-foreground">
            Welcome back • Real-time dashboard metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`
            ${isEnterprise ? 'bg-purple-100 text-purple-800' : ''}
            ${isPremium ? 'bg-yellow-100 text-yellow-800' : ''}
            ${currentTier === 'basic' ? 'bg-blue-100 text-blue-800' : ''}
          `}>
            {currentTier.toUpperCase()} Plan
          </Badge>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Quality Alert */}
      {missingRecords > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Data Quality Notice:</strong> {missingRecords} patients are missing compliance records. 
            <Button variant="link" className="h-auto p-0 ml-2 text-yellow-800 underline">
              Fix missing records
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Metrics Grid - Dynamic based on tier */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isPremium || isEnterprise ? 'xl:grid-cols-5' : ''} gap-6`}>
        
        {/* Basic Metrics - Available to all tiers */}
        
        {/* Total Active Employees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalActiveEmployees}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>Registered in system</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card className={complianceRate >= 95 ? "border-green-200" : complianceRate >= 80 ? "border-yellow-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${complianceRate >= 95 ? 'text-green-600' : complianceRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
              {isLoading ? '...' : `${complianceRate}%`}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Valid medical certificates</span>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Expiring */}
        <Card className={certificatesExpiring > 10 ? "border-red-200" : certificatesExpiring > 5 ? "border-orange-200" : "border-green-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${certificatesExpiring > 10 ? 'text-red-600' : certificatesExpiring > 5 ? 'text-orange-600' : 'text-green-600'}`}>
              {isLoading ? '...' : certificatesExpiring}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Next 30 days</span>
              {certificatesExpiring === 0 && !isLoading && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  All current
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tests This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : testsThisMonth}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              {!isLoading && monthOverMonthChange !== 0 && (
                <span className={`flex items-center gap-1 ${monthOverMonthChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthOverMonthChange > 0 ? '+' : ''}{monthOverMonthChange} from last month
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className={pendingReviews > 10 ? "border-orange-200" : "border-green-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingReviews > 10 ? 'text-orange-600' : 'text-green-600'}`}>
              {isLoading ? '...' : pendingReviews}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Awaiting attention</span>
              {pendingReviews <= 5 && !isLoading && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Low backlog
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className={systemHealth >= 95 ? "border-green-200" : systemHealth >= 85 ? "border-yellow-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${systemHealth >= 95 ? 'text-green-600' : systemHealth >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
              {isLoading ? '...' : `${systemHealth}%`}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Document processing rate</span>
              {systemHealth >= 99 && !isLoading && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Excellent
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premium Metrics - Only for Premium and Enterprise users */}
        {(isPremium || isEnterprise) && (
          <>
            {/* Health Intelligence Score */}
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Intelligence Score</CardTitle>
                <Brain className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${healthIntelligenceScore >= 85 ? 'text-green-600' : healthIntelligenceScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {isLoading ? '...' : `${healthIntelligenceScore}/100`}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>AI-powered health assessment</span>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    Premium
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Active Risk Alerts */}
            <Card className={activeRiskAlerts > 5 ? "border-red-200 bg-red-50" : activeRiskAlerts > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Risk Alerts</CardTitle>
                <Shield className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${activeRiskAlerts > 5 ? 'text-red-600' : activeRiskAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {isLoading ? '...' : activeRiskAlerts}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Require immediate attention</span>
                  {activeRiskAlerts === 0 && !isLoading && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      All clear
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Departments Tracked */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments Tracked</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? '...' : departmentsTracked}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Unique job categories</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Analytics
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Accuracy - Coming Soon */}
            <Card className="border-gray-200 bg-gray-50 opacity-75">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
                <Target className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  --
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ML model performance</span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    Coming Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Priority Actions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Key tasks that need your attention this week
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!loading && (
              <>
                {certificatesExpiring > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Schedule {certificatesExpiring} certificate renewals (due in 30 days)</span>
                  </div>
                )}
                {pendingReviews > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Review {pendingReviews} pending document approvals</span>
                  </div>
                )}
                {complianceRate < 90 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Improve compliance rate (currently {complianceRate}%)</span>
                  </div>
                )}
                {missingRecords > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Complete compliance records for {missingRecords} patients</span>
                  </div>
                )}
                {certificatesExpiring === 0 && pendingReviews <= 5 && complianceRate >= 90 && missingRecords === 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>All systems operating normally - no urgent actions required</span>
                  </div>
                )}
              </>
            )}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span>Loading priority actions...</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Schedule Renewals
            </Button>
            <Button variant="outline" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Review Documents
            </Button>
            <Button variant="outline" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Sections Grid - Now 2x2 without QuickActions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentProcessingTrends />
        <TaskWidget variant="detailed" maxTasks={5} />
        <RecentActivity />
        <RecentDocuments />
      </div>

      {/* Quick Actions - Full Width at Bottom */}
      <QuickActions />

      {/* Footer */}
      <div className="text-xs text-muted-foreground">
        Last updated: {new Date().toLocaleTimeString()} • 
        Data source: Real-time database queries
        {error && (
          <span className="text-red-600 ml-2">
            (Some data may be unavailable due to errors)
          </span>
        )}
      </div>
      
    </div>
  );
}
