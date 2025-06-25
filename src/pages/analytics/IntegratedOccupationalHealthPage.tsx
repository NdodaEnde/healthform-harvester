
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import FeatureGate from '@/components/FeatureGate';
import AnalyticsFeatureGate from '@/components/analytics/AnalyticsFeatureGate';

// Import hooks
import { useExaminationAnalytics } from '@/hooks/useExaminationAnalytics';
import { useRiskComplianceAnalytics } from '@/hooks/useRiskComplianceAnalytics';

// Import components
import BasicOverviewTab from '@/components/analytics/BasicOverviewTab';
import BasicReports from '@/components/analytics/BasicReports';
import TaskManagementDashboard from '@/components/tasks/TaskManagementDashboard';
import BackfillTestResultsUtility from '@/components/admin/BackfillTestResultsUtility';

// Analytics components
import MedicalFitnessDeclarationChart from './components/MedicalFitnessDeclarationChart';
import ExaminationTypeAnalytics from './components/ExaminationTypeAnalytics';
import EnhancedMedicalTestAnalytics from './components/EnhancedMedicalTestAnalytics';
import EnhancedRestrictionsAnalytics from './components/EnhancedRestrictionsAnalytics';
import RiskAnalysisDashboard from './components/RiskAnalysisDashboard';
import CertificateComplianceCard from './components/CertificateComplianceCard';
import AdvancedReportGenerator from './components/AdvancedReportGenerator';
import CompanyBenchmarkingDashboard from './components/CompanyBenchmarkingDashboard';
import PredictiveAnalyticsDashboard from './components/PredictiveAnalyticsDashboard';
import InteractiveDataExploration from './components/InteractiveDataExploration';
import TestTypeBreakdownCard from './components/TestTypeBreakdownCard';
import FitnessCertificateStats from './components/FitnessCertificateStats';
import FitnessStatusBarChart from '@/components/analytics/FitnessStatusBarChart';

const IntegratedOccupationalHealthPage = () => {
  const { data: examinationData, isLoading: examinationLoading } = useExaminationAnalytics();
  const { data: riskComplianceData, isLoading: riskComplianceLoading } = useRiskComplianceAnalytics();

  const isLoading = examinationLoading || riskComplianceLoading;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>Occupational Health Analytics | Health Management System</title>
      </Helmet>
      
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Occupational Health Analytics</h1>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Live System
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Comprehensive insights into occupational health metrics, compliance status, and workforce analytics.
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex lg:h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="risk-compliance" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Risk & Compliance
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            Task Management
          </TabsTrigger>
          <TabsTrigger value="reports-tools" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            Reports & Tools
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <BasicOverviewTab />
        </TabsContent>
        
        {/* Analytics Tab - Now with live data */}
        <TabsContent value="analytics" className="space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading analytics data...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Basic Analytics - Available to all tiers */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-2xl font-semibold text-gray-900">Examination Volume Overview</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Breakdown of examination types and volumes
                  </p>
                </div>
                
                {/* Row 1: Pre-employment, Periodical, Exit - Live data */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-700">Pre-employment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-800">
                        {examinationData?.examinationTypes.preEmployment || 0}
                      </div>
                      <p className="text-sm text-blue-600 mt-1">Initial health screenings</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-green-700">Periodical</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-800">
                        {examinationData?.examinationTypes.periodical || 0}
                      </div>
                      <p className="text-sm text-green-600 mt-1">Regular health checkups</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-amber-700">Exit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-800">
                        {examinationData?.examinationTypes.exit || 0}
                      </div>
                      <p className="text-sm text-amber-600 mt-1">End of employment</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Fitness Status Summary - Live data */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-2xl font-semibold text-gray-900">Fitness Status Summary</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current workforce fitness declarations and visual breakdown
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-emerald-700">Fit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-800">
                        {examinationData?.fitnessStatus.fit || 0}
                      </div>
                      <p className="text-sm text-emerald-600 mt-1">No restrictions required</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-orange-700">Fit with Restrictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-800">
                        {examinationData?.fitnessStatus.fitWithRestriction || 0}
                      </div>
                      <p className="text-sm text-orange-600 mt-1">Limited work activities</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-purple-700">Fit with Condition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-800">
                        {examinationData?.fitnessStatus.fitWithCondition || 0}
                      </div>
                      <p className="text-sm text-purple-600 mt-1">Conditional fitness</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Add the fitness status pie chart with live data */}
                {examinationData && (
                  <FitnessStatusBarChart data={examinationData.fitnessStatus} />
                )}
              </div>

              {/* Medical Tests Overview - Basic tier */}
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h2 className="text-2xl font-semibold text-gray-900">Medical Examination Conducted Includes The Following Tests</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overview of medical tests included in examinations
                  </p>
                </div>
                
                <TestTypeBreakdownCard className="w-full" />
              </div>

              {/* Distribution Analysis - Premium Feature */}
              <AnalyticsFeatureGate 
                requiredTier="premium"
                title="Advanced Distribution Analysis"
                description="Visual breakdown of fitness declarations with advanced charting and analytics."
              >
                <div className="space-y-6">
                  <div className="border-b pb-3">
                    <h2 className="text-2xl font-semibold text-gray-900">Distribution Analysis</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visual breakdown of fitness declarations and status comparisons
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <MedicalFitnessDeclarationChart />
                  </div>
                </div>
              </AnalyticsFeatureGate>

              {/* Type-based Analytics - Premium Feature */}
              <AnalyticsFeatureGate 
                requiredTier="premium"
                title="Advanced Type-based Analytics"
                description="Detailed examination type distribution and volume comparisons with trend analysis."
              >
                <div className="space-y-6">
                  <div className="border-b pb-3">
                    <h2 className="text-2xl font-semibold text-gray-900">Type-based Analytics</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Examination type distribution and volume comparisons
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ExaminationTypeAnalytics />
                  </div>
                </div>
              </AnalyticsFeatureGate>

              {/* Historical Trends - Premium Feature */}
              <AnalyticsFeatureGate 
                requiredTier="premium"
                title="Historical Trends & Patterns"
                description="Advanced historical analysis with trend detection and pattern recognition."
              >
                <div className="space-y-6">
                  <div className="border-b pb-3">
                    <h2 className="text-2xl font-semibold text-gray-900">Historical Trends</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Examination trends and patterns over time
                    </p>
                  </div>
                  
                  <EnhancedMedicalTestAnalytics />
                </div>
              </AnalyticsFeatureGate>
            </div>
          )}
        </TabsContent>
        
        {/* Risk & Compliance Tab - Now with live data */}
        <TabsContent value="risk-compliance" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading compliance data...</span>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Risk Level Summary */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Risk Assessment Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-red-700">High Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-800">
                        {riskComplianceData?.riskLevels.high || 0}
                      </div>
                      <p className="text-sm text-red-600 mt-1">Immediate attention required</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-amber-700">Medium Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-amber-800">
                        {riskComplianceData?.riskLevels.medium || 0}
                      </div>
                      <p className="text-sm text-amber-600 mt-1">Monitor closely</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-green-700">Low Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-800">
                        {riskComplianceData?.riskLevels.low || 0}
                      </div>
                      <p className="text-sm text-green-600 mt-1">Standard monitoring</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Compliance Summary */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Compliance Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-emerald-700">Compliant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-800">
                        {riskComplianceData?.compliance.compliant || 0}
                      </div>
                      <p className="text-sm text-emerald-600 mt-1">Current certificates valid</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-orange-700">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-800">
                        {riskComplianceData?.compliance.expiringIn30Days || 0}
                      </div>
                      <p className="text-sm text-orange-600 mt-1">Next 30 days</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-red-700">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-800">
                        {riskComplianceData?.compliance.overdue || 0}
                      </div>
                      <p className="text-sm text-red-600 mt-1">Immediate action needed</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-700">With Restrictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-800">
                        {riskComplianceData?.restrictions.totalWithRestrictions || 0}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Active work restrictions</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Occupational Restrictions</h2>
                <FeatureGate requiredTier="premium">
                  <EnhancedRestrictionsAnalytics />
                </FeatureGate>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Risk Assessment</h2>
                <FeatureGate requiredTier="premium">
                  <RiskAnalysisDashboard />
                </FeatureGate>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Compliance Monitoring</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CertificateComplianceCard />
                  <Card>
                    <CardHeader>
                      <CardTitle>Compliance Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        Compliance timeline visualization
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Advanced Analytics</h2>
                <div className="grid gap-6">
                  <FeatureGate requiredTier="enterprise">
                    <CompanyBenchmarkingDashboard />
                  </FeatureGate>
                  <FeatureGate requiredTier="enterprise">
                    <PredictiveAnalyticsDashboard />
                  </FeatureGate>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Task Management Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <TaskManagementDashboard />
        </TabsContent>

        {/* Reports & Tools Tab */}
        <TabsContent value="reports-tools" className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Report Generation</h2>
              <div className="grid gap-6">
                <BasicReports />
                <FeatureGate requiredTier="premium">
                  <AdvancedReportGenerator />
                </FeatureGate>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Data Exploration</h2>
              <FeatureGate requiredTier="premium">
                <InteractiveDataExploration />
              </FeatureGate>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Administrative Tools</h2>
              <div className="grid gap-6">
                <BackfillTestResultsUtility />
                <Card>
                  <CardHeader>
                    <CardTitle>Data Quality Tools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Tools for maintaining data quality and resolving issues with medical test extraction.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
