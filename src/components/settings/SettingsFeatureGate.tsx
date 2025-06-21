
import React from 'react';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { usePackage } from '@/contexts/PackageContext';
import { FeatureKey, PackageTier } from '@/types/subscription';

interface SettingsFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  settingsFeatures?: string[];
  className?: string;
}

const SettingsFeatureGate: React.FC<SettingsFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  settingsFeatures,
  className
}) => {
  const { colors } = usePackage();

  const defaultSettingsFeatures = {
    premium: [
      'Custom branding settings',
      'Advanced organization settings',
      'Department management',
      'Custom notification preferences',
      'API configuration access'
    ],
    enterprise: [
      'White-label configuration',
      'Advanced security settings',
      'Custom integrations setup',
      'Multi-tenant management',
      'Advanced audit controls'
    ]
  };

  const targetTier = requiredTier || 'premium';
  const features = settingsFeatures || defaultSettingsFeatures[targetTier as keyof typeof defaultSettingsFeatures] || [];

  const settingsUpgradeFallback = (
    <UpgradePromptCard
      targetTier={targetTier}
      title={title || `${targetTier === 'premium' ? 'Premium' : 'Enterprise'} Settings Required`}
      description={description || `Access advanced configuration options with ${targetTier} features.`}
      features={features}
      className={className}
    />
  );

  return (
    <EnhancedFeatureGate
      feature={feature}
      requiredTier={requiredTier}
      fallback={settingsUpgradeFallback}
      showUpgradePrompt={false}
      className={className}
    >
      {children}
    </EnhancedFeatureGate>
  );
};

export default SettingsFeatureGate;
