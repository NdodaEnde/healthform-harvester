
import React from 'react';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { usePackage } from '@/contexts/PackageContext';
import { FeatureKey, PackageTier } from '@/types/subscription';

interface ReportsFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  reportFeatures?: string[];
  className?: string;
}

const ReportsFeatureGate: React.FC<ReportsFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  reportFeatures,
  className
}) => {
  const { colors } = usePackage();

  const defaultReportFeatures = {
    premium: [
      'Advanced analytics reports',
      'Custom branded templates',
      'Automated report scheduling',
      'Department-level breakdowns',
      'Executive summaries'
    ],
    enterprise: [
      'Strategic intelligence reports',
      'Competitive benchmarking',
      'White-label report generation',
      'Custom business KPIs',
      'Board-ready presentations'
    ]
  };

  const targetTier = requiredTier || 'premium';
  const features = reportFeatures || defaultReportFeatures[targetTier as keyof typeof defaultReportFeatures] || [];

  const reportsUpgradeFallback = (
    <UpgradePromptCard
      targetTier={targetTier}
      title={title || `${targetTier === 'premium' ? 'Premium' : 'Enterprise'} Reports Required`}
      description={description || `Access advanced reporting capabilities with ${targetTier} features.`}
      features={features}
      className={className}
    />
  );

  return (
    <EnhancedFeatureGate
      feature={feature}
      requiredTier={requiredTier}
      fallback={reportsUpgradeFallback}
      showUpgradePrompt={false}
      className={className}
    >
      {children}
    </EnhancedFeatureGate>
  );
};

export default ReportsFeatureGate;
