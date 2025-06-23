
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import OccupationalHealthDashboard from '@/components/analytics/OccupationalHealthDashboard';
import MedicalReports from '@/components/analytics/MedicalReports';
import BackfillTestResultsUtility from '@/components/admin/BackfillTestResultsUtility';
import FeatureGate from '@/components/FeatureGate';

// Import specialized medical components
import MedicalFitnessDeclarationChart from './components/MedicalFitnessDeclarationChart';
import EnhancedRestrictionsAnalytics from './components/EnhancedRestrictionsAnalytics';
import ExaminationTypeAnalytics from './components/ExaminationTypeAnalytics';
import EnhancedMedicalTestAnalytics from './components/EnhancedMedicalTestAnalytics';
import HealthMetricsAssessment from './components/HealthMetricsAssessment';
import CertificateComplianceCard from './components/CertificateComplianceCard';

const IntegratedOccupationalHealthPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Helmet>
        <title>Occupational Health Analytics | Health Management System</title>
      </Helmet>
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Occupational Health Analytics</h1>
        <p className="text-muted-foreground">
          Clinical insights, medical test analytics, and health compliance monitoring for occupational health professionals.
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Health Overview</TabsTrigger>
          <TabsTrigger value="medical-reports">Clinical Reports</TabsTrigger>
          <TabsTrigger value="fitness-declarations">Fitness Status</TabsTrigger>
          <TabsTrigger value="medical-tests">Medical Tests</TabsTrigger>
          <TabsTrigger value="compliance">Health Compliance</TabsTrigger>
          <TabsTrigger value="admin">Clinical Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OccupationalHealthDashboard />
        </TabsContent>
        
        <TabsContent value="medical-reports" className="space-y-4">
          <MedicalReports />
        </TabsContent>
        
        <TabsContent value="fitness-declarations" className="space-y-4">
          <MedicalFitnessDeclarationChart />
        </TabsContent>
        
        <TabsContent value="medical-tests" className="space-y-4">
          <div className="space-y-6">
            <EnhancedMedicalTestAnalytics />
            <ExaminationTypeAnalytics />
            
            <FeatureGate requiredTier="premium">
              <EnhancedRestrictionsAnalytics />
            </FeatureGate>
          </div>
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <CertificateComplianceCard />
            <Card>
              <CardHeader>
                <CardTitle>Medical Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Overview of medical compliance requirements and certification status.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <HealthMetricsAssessment />
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Administration Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Tools for clinical data management and medical test administration.
              </p>
            </CardContent>
          </Card>
          
          <BackfillTestResultsUtility />
          
          <Card>
            <CardHeader>
              <CardTitle>Medical Data Quality Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tools for maintaining medical data quality and resolving issues with medical test extraction.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
