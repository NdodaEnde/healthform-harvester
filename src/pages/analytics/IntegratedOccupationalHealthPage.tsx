
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import { Badge } from "@/components/ui/badge";
import FeatureGate from '@/components/FeatureGate';

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

const IntegratedOccupationalHealthPage = () => {
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
        
        {/* Analytics Tab - Redesigned */}
        <TabsContent value="analytics" className="space-y-8">
          <div className="space-y-8">
            {/* Key Health Metrics Section */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-2xl font-semibold text-gray-900">Key Health Metrics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Overview of essential health indicators and compliance rates
                </p>
              </div>
              
              {/* Medical Fitness Overview - 2x2 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MedicalFitnessDeclarationChart />
                <ExaminationTypeAnalytics />
              </div>
            </div>
            
            {/* Medical Test Analysis Section */}
            <div className="space-y-6">
              <div className="border-b pb-3">
                <h2 className="text-2xl font-semibold text-gray-900">Medical Test Analysis</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Detailed breakdown of medical test results and trends
                </p>
              </div>
              
              {/* Full-width test analytics */}
              <EnhancedMedicalTestAnalytics />
            </div>
          </div>
        </TabsContent>
        
        {/* Risk & Compliance Tab */}
        <TabsContent value="risk-compliance" className="space-y-6">
          <div className="grid gap-6">
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
