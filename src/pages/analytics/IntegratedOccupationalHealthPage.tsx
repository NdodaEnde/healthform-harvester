import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsSummaryCards from './components/StatsSummaryCards';
import FitnessCertificateStats from './components/FitnessCertificateStats';
import TestTypeBreakdownCard from './components/TestTypeBreakdownCard';
import OccupationalRestrictionsChart from './components/OccupationalRestrictionsChart';
import CertificateComplianceCard from './components/CertificateComplianceCard';
import HealthMetricsAssessment from './components/HealthMetricsAssessment';
import OccupationalHealthMetricsChart from './components/OccupationalHealthMetricsChart';
import CorporateHealthMetricsPanel from './components/CorporateHealthMetricsPanel';
import ReportGeneratorCard from './components/ReportGeneratorCard';
import { Helmet } from 'react-helmet';

const IntegratedOccupationalHealthPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet>
        <title>Integrated Occupational Health Analytics | Health Management System</title>
      </Helmet>
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrated Occupational Health Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into occupational health metrics, risk factors, and compliance status.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="health-metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <StatsSummaryCards />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FitnessCertificateStats />
            <OccupationalRestrictionsChart />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <OccupationalHealthMetricsChart />
            </div>
            <div>
              <TestTypeBreakdownCard />
            </div>
          </div>
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
          <ReportGeneratorCard />
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Access and download previously generated reports.
              </p>
              {/* Recent reports list would go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
