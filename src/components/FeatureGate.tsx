
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PackageTier } from '@/types/subscription';

interface FeatureGateProps {
  feature?: string;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const { hasFeature, canAccessFeature, currentTier, upgradeSubscription } = useSubscription();

  // Check access based on feature or tier
  const hasAccess = feature ? hasFeature(feature) : requiredTier ? canAccessFeature(requiredTier) : true;

  if (hasAccess) {
    return <>{children}</>;
  }

  // If no upgrade prompt requested, show fallback or nothing
  if (!showUpgradePrompt) {
    return fallback ? <>{fallback}</> : null;
  }

  // Determine the target tier for upgrade
  const targetTier = requiredTier || (feature ? 'premium' : 'premium');
  const tierIcons = {
    basic: Lock,
    premium: Zap,
    enterprise: Crown
  };
  const TierIcon = tierIcons[targetTier];

  const tierColors = {
    basic: 'bg-gray-100 text-gray-800',
    premium: 'bg-yellow-100 text-yellow-800',
    enterprise: 'bg-purple-100 text-purple-800'
  };

  const handleUpgrade = async () => {
    const success = await upgradeSubscription(targetTier);
    if (success) {
      // Show success message or refresh the page
      window.location.reload();
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 p-3 rounded-full bg-gray-100 w-fit">
          <TierIcon className="h-6 w-6 text-gray-600" />
        </div>
        <CardTitle className="text-lg">
          {targetTier === 'premium' ? 'Premium Feature' : 'Enterprise Feature'}
        </CardTitle>
        <div className="flex justify-center">
          <Badge className={tierColors[targetTier]}>
            {targetTier.toUpperCase()} REQUIRED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          {targetTier === 'premium' 
            ? 'Upgrade to Premium to unlock advanced analytics and reporting features.'
            : 'Upgrade to Enterprise for predictive analytics and strategic insights.'
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
        <p className="text-xs text-muted-foreground">
          Currently on: <span className="font-medium capitalize">{currentTier}</span>
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureGate;
