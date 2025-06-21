
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier, FeatureKey } from '@/types/subscription';

interface EnhancedFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

const EnhancedFeatureGate: React.FC<EnhancedFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true,
  className
}) => {
  const { getFeatureGate, canAccessFeature, upgradePackage, upgradeTarget } = usePackage();

  // Determine access based on feature or tier
  let hasAccess = true;
  let gateConfig = null;

  if (feature) {
    gateConfig = getFeatureGate(feature);
    hasAccess = gateConfig.hasAccess;
  } else if (requiredTier) {
    hasAccess = canAccessFeature(requiredTier);
    gateConfig = { requiredTier, hasAccess };
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  // If no upgrade prompt requested, show fallback or nothing
  if (!showUpgradePrompt) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // Determine the target tier for upgrade
  const targetTier = gateConfig?.requiredTier || requiredTier || upgradeTarget || 'premium';
  
  const tierIcons = {
    basic: Lock,
    premium: Zap,
    enterprise: Crown
  };
  const TierIcon = tierIcons[targetTier];

  const tierColors = {
    basic: 'bg-gray-100 text-gray-800 border-gray-300',
    premium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    enterprise: 'bg-purple-100 text-purple-800 border-purple-300'
  };

  const handleUpgrade = async () => {
    const success = await upgradePackage(targetTier);
    if (success) {
      // Refresh the page to show new features
      window.location.reload();
    }
  };

  return (
    <Card className={`border-dashed border-2 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 p-3 rounded-full bg-gray-100 w-fit">
          <TierIcon className="h-6 w-6 text-gray-600" />
        </div>
        <CardTitle className="text-lg">
          {targetTier === 'premium' ? 'Premium Feature' : 
           targetTier === 'enterprise' ? 'Enterprise Feature' : 'Advanced Feature'}
        </CardTitle>
        <div className="flex justify-center">
          <Badge variant="outline" className={tierColors[targetTier]}>
            {targetTier.toUpperCase()} REQUIRED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {targetTier === 'premium' 
            ? 'Upgrade to Premium to unlock AI-powered insights and advanced analytics.'
            : targetTier === 'enterprise'
            ? 'Upgrade to Enterprise for strategic insights and competitive benchmarking.'
            : 'Upgrade to access this advanced feature.'
          }
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm">
            Learn More
          </Button>
          <Button onClick={handleUpgrade} size="sm">
            Upgrade to {targetTier}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedFeatureGate;
