
import React from 'react';
import { usePackage } from '@/contexts/PackageContext';
import UpgradePromptCard from '@/components/UpgradePromptCard';

const PackageStatusBanner: React.FC = () => {
  const { currentTier, isBasic, isPremium } = usePackage();

  // Only show upgrade banner for basic and premium users
  if (!isBasic && !isPremium) return null;

  const shouldShowBanner = Math.random() > 0.7; // Show occasionally to avoid being too pushy
  if (!shouldShowBanner) return null;

  return (
    <div className="mb-6">
      <UpgradePromptCard
        targetTier={isBasic ? 'premium' : 'enterprise'}
        variant="banner"
        title={isBasic ? 'Ready to unlock AI-powered insights?' : 'Ready for strategic intelligence?'}
        description={
          isBasic 
            ? 'Upgrade to Premium for advanced analytics and predictive insights'
            : 'Upgrade to Enterprise for competitive benchmarking and strategic reports'
        }
      />
    </div>
  );
};

export default PackageStatusBanner;
