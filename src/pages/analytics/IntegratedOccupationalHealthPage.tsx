
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import OccupationalHealthDashboard from '@/components/analytics/OccupationalHealthDashboard';
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
        <title>Occupational Health Management | Clinical Operations</title>
      </Helmet>
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Occupational Health Management</h1>
        <p className="text-muted-foreground">
          Clinical workflows, medical assessments, and occupational health operations for healthcare professionals.
        </p>
      </div>
      
      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="workflow">Clinical Workflow</TabsTrigger>
          <TabsTrigger value="assessments">Medical Assessments</TabsTrigger>
          <TabsTrigger value="fitness-status">Fitness Management</TabsTrigger>
          <TabsTrigger value="medical-protocols">Medical Protocols</TabsTrigger>
          <TabsTrigger value="compliance">Health Compliance</TabsTrigger>
          <TabsTrigger value="clinical-tools">Clinical Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workflow" className="space-y-4">
          <OccupationalHealthDashboard />
        </TabsContent>
        
        <TabsContent value="assessments" className="space-y-4">
          <div className="space-y-6">
            <EnhancedMedicalTestAnalytics />
            <ExaminationTypeAnalytics />
          </div>
        </TabsContent>
        
        <TabsContent value="fitness-status" className="space-y-4">
          <div className="space-y-6">
            <MedicalFitnessDeclarationChart />
            
            <FeatureGate requiredTier="premium">
              <EnhancedRestrictionsAnalytics />
            </FeatureGate>
          </div>
        </TabsContent>
        
        <TabsContent value="medical-protocols" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Testing Protocols</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Standardized medical examination protocols and clinical procedures.
              </p>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Pre-Employment Medical Protocol</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive health assessment for new employees including vision, hearing, and fitness evaluation.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Periodic Health Surveillance</h3>
                  <p className="text-sm text-muted-foreground">
                    Regular health monitoring for employees in high-risk occupations with exposure-specific testing.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Return to Work Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Medical clearance process following injury or illness to ensure safe return to work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <CertificateComplianceCard />
            <Card>
              <CardHeader>
                <CardTitle>Medical Compliance Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track medical compliance requirements and certification status across your workforce.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <HealthMetricsAssessment />
        </TabsContent>

        <TabsContent value="clinical-tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Administration Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Professional tools for clinical data management and medical examination administration.
              </p>
            </CardContent>
          </Card>
          
          <BackfillTestResultsUtility />
          
          <Card>
            <CardHeader>
              <CardTitle>Medical Data Quality Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tools for maintaining medical data integrity and resolving issues with clinical data extraction and processing.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedOccupationalHealthPage;
