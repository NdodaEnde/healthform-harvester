
import React from 'react';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { usePackage } from '@/contexts/PackageContext';
import { FeatureKey, PackageTier } from '@/types/subscription';

interface CertificatesFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  certificateFeatures?: string[];
  className?: string;
}

const CertificatesFeatureGate: React.FC<CertificatesFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  certificateFeatures,
  className
}) => {
  const { colors } = usePackage();

  const defaultCertificateFeatures = {
    premium: [
      'Custom certificate templates',
      'Advanced certificate validation',
      'Automated certificate generation',
      'Custom branding on certificates',
      'Certificate expiry predictions'
    ],
    enterprise: [
      'White-label certificates',
      'API-based certificate generation',
      'Custom certificate workflows',
      'Advanced certificate analytics',
      'Multi-template management'
    ]
  };

  const targetTier = requiredTier || 'premium';
  const features = certificateFeatures || defaultCertificateFeatures[targetTier as keyof typeof defaultCertificateFeatures] || [];

  const certificatesUpgradeFallback = (
    <UpgradePromptCard
      targetTier={targetTier}
      title={title || `${targetTier === 'premium' ? 'Premium' : 'Enterprise'} Certificates Required`}
      description={description || `Access advanced certificate management with ${targetTier} features.`}
      features={features}
      className={className}
    />
  );

  return (
    <EnhancedFeatureGate
      feature={feature}
      requiredTier={requiredTier}
      fallback={certificatesUpgradeFallback}
      showUpgradePrompt={false}
      className={className}
    >
      {children}
    </EnhancedFeatureGate>
  );
};

export default CertificatesFeatureGate;
