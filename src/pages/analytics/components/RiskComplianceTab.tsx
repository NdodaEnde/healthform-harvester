
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureGate from '@/components/FeatureGate';
import EnhancedRestrictionsAnalytics from './EnhancedRestrictionsAnalytics';
import RiskAnalysisDashboard from './RiskAnalysisDashboard';
import CertificateComplianceCard from './CertificateComplianceCard';
import CompanyBenchmarkingDashboard from './CompanyBenchmarkingDashboard';
import PredictiveAnalyticsDashboard from './PredictiveAnalyticsDashboard';

const RiskComplianceTab: React.FC = () => {
  return (
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
  );
};

export default RiskComplianceTab;
