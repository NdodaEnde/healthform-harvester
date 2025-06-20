
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import BackfillTestResultsUtility from '@/components/admin/BackfillTestResultsUtility';

// Lazy load components for better performance
import OptimizedOverviewTab from './components/OptimizedOverviewTab';
import StatsSummaryCards from './components/StatsSummaryCards';
import FitnessCertificateStats from './components/FitnessCertificateStats';
import TestTypeBreakdownCard from './components/TestTypeBreakdownCard';
import OccupationalRestrictionsChart from './components/OccupationalRestrictionsChart';
import CertificateComplianceCard from './components/CertificateComplianceCard';
import HealthMetricsAssessment from './components/HealthMetricsAssessment';
import OccupationalHealthMetricsChart from './components/OccupationalHealthMetricsChart';
import CorporateHealthMetricsPanel from './components/CorporateHealthMetricsPanel';
import ReportGeneratorCard from './components/ReportGeneratorCard';
import EnhancedMedicalTestAnalytics from './components/EnhancedMedicalTestAnalytics';
import ExecutiveSummaryBanner from './components/ExecutiveSummaryBanner';
import RiskAnalysisDashboard from './components/RiskAnalysisDashboard';
import CompanyBenchmarkingDashboard from './components/CompanyBenchmarkingDashboard';
import PredictiveAnalyticsDashboard from './components/PredictiveAnalyticsDashboard';
import InteractiveDataExploration from './components/InteractiveDataExploration';
import AdvancedReportGenerator from './components/AdvancedReportGenerator';

const IntegratedOccupationalHealthPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet>
        <title>Integrated Occupational Health Analytics | Health Management System</title>
      </Helmet>
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrated Occupational Health Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into occupational health metrics, medical test results, risk factors, and compliance status.
        </p>
      </div>

      {/* Executive Summary Banner */}
      <ExecutiveSummaryBanner />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical-tests">Medical Tests</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="data-exploration">Data Exploration</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="health-metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="admin">Admin Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OptimizedOverviewTab />
        </TabsContent>
        
        <TabsContent value="medical-tests" className="space-y-4">
          <EnhancedMedicalTestAnalytics />
        </TabsContent>
        
        <TabsContent value="risk-analysis" className="space-y-4">
          <RiskAnalysisDashboard />
        </TabsContent>
        
        <TabsContent value="benchmarking" className="space-y-4">
          <CompanyBenchmarkingDashboard />
        </TabsContent>
        
        <TabsContent value="predictive" className="space-y-4">
          <PredictiveAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="data-exploration" className="space-y-4">
          <InteractiveDataExploration />
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CertificateComplianceCard />
            <Card>
              <CardHeader>
                <CardTitle>Certificates Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  List of certificates that will expire in the next 30 days.
                </p>
                {/* Expiring certificates list would go here */}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Compliance Timeline</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {/* Compliance timeline chart would go here */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="health-metrics" className="space-y-4">
          <HealthMetricsAssessment />
          <CorporateHealthMetricsPanel />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <AdvancedReportGenerator />
          
          <Card>
            <CardHeader>
              <CardTitle>Legacy Report Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportGeneratorCard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
