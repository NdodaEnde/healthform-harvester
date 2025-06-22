
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
  AlertCircle
} from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export default function Dashboard() {
  const {
    totalPatients,
    complianceRate,
    certificatesExpiring,
    testsThisMonth,
    testsLastMonth,
    pendingReviews,
    systemHealth,
    missingRecords,
    isLoading,
    error,
    refetchAll
  } = useDashboardMetrics();

  // Calculate month-over-month change
  const monthOverMonthChange = testsThisMonth - testsLastMonth;
  const monthOverMonthPercentage = testsLastMonth > 0 
    ? Math.round(((testsThisMonth - testsLastMonth) / testsLastMonth) * 100)
    : 0;

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
          <Badge variant="outline">BASIC Plan</Badge>
          <Button 
            onClick={refetchAll} 
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

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Active Employees - REAL DATA ✅ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : totalPatients}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>Registered in system</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Rate - REAL DATA ✅ */}
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
              <span>Fitness compliance rate</span>
            </div>
          </CardContent>
        </Card>

        {/* Certificates Expiring - REAL DATA ✅ */}
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

        {/* Tests This Month - REAL DATA ✅ */}
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

        {/* Pending Reviews - REAL DATA ✅ */}
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

        {/* System Health - REAL DATA ✅ */}
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
            {!isLoading && (
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
            {isLoading && (
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
