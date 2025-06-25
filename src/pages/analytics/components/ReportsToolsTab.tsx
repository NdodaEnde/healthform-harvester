
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureGate from '@/components/FeatureGate';
import BasicReports from '@/components/analytics/BasicReports';
import BackfillTestResultsUtility from '@/components/admin/BackfillTestResultsUtility';
import AdvancedReportGenerator from './AdvancedReportGenerator';
import InteractiveDataExploration from './InteractiveDataExploration';

const ReportsToolsTab: React.FC = () => {
  return (
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
  );
};

export default ReportsToolsTab;
