
import React from 'react';
import AnalyticsFeatureGate from '@/components/analytics/AnalyticsFeatureGate';
import MedicalFitnessDeclarationChart from './MedicalFitnessDeclarationChart';
import ExaminationTypeAnalytics from './ExaminationTypeAnalytics';
import EnhancedMedicalTestAnalytics from './EnhancedMedicalTestAnalytics';

const PremiumAnalyticsFeatures: React.FC = () => {
  return (
    <>
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
    </>
  );
};

export default PremiumAnalyticsFeatures;
