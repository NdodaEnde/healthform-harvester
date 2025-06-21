
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Crown } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier } from '@/types/subscription';

interface FeatureComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: PackageTier) => void;
}

const FeatureComparisonModal: React.FC<FeatureComparisonModalProps> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  const { currentTier } = usePackage();

  const features = [
    {
      name: 'Employee Health Tracking',
      basic: true,
      premium: true,
      enterprise: true
    },
    {
      name: 'Basic Compliance Reports',
      basic: true,
      premium: true,
      enterprise: true
    },
    {
      name: 'Certificate Management',
      basic: true,
      premium: true,
      enterprise: true
    },
    {
      name: 'AI-Powered Insights',
      basic: false,
      premium: true,
      enterprise: true
    },
    {
      name: 'Advanced Analytics',
      basic: false,
      premium: true,
      enterprise: true
    },
    {
      name: 'Department Breakdowns',
      basic: false,
      premium: true,
      enterprise: true
    },
    {
      name: 'Custom Branding',
      basic: false,
      premium: true,
      enterprise: true
    },
    {
      name: 'Predictive Analytics',
      basic: false,
      premium: false,
      enterprise: true
    },
    {
      name: 'Competitive Benchmarking',
      basic: false,
      premium: false,
      enterprise: true
    },
    {
      name: 'API Access',
      basic: false,
      premium: false,
      enterprise: true
    },
    {
      name: 'White-label Reports',
      basic: false,
      premium: false,
      enterprise: true
    }
  ];

  const tierInfo = {
    basic: { name: 'Basic', price: '$99', icon: null, color: 'bg-gray-50' },
    premium: { name: 'Premium', price: '$299', icon: Zap, color: 'bg-yellow-50' },
    enterprise: { name: 'Enterprise', price: '$999', icon: Crown, color: 'bg-purple-50' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Compare Plans</DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-sm font-medium text-muted-foreground">Features</div>
            {(['basic', 'premium', 'enterprise'] as PackageTier[]).map((tier) => {
              const info = tierInfo[tier];
              const IconComponent = info.icon;
              const isCurrentTier = currentTier === tier;
              
              return (
                <div key={tier} className={`text-center p-4 rounded-lg border-2 ${isCurrentTier ? 'border-primary bg-primary/5' : 'border-gray-200'} ${info.color}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                    <h3 className="font-semibold">{info.name}</h3>
                  </div>
                  <p className="text-lg font-bold">{info.price}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                  {isCurrentTier && (
                    <Badge variant="default" className="mt-2">Current Plan</Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium">{feature.name}</div>
                <div className="text-center">
                  {feature.basic ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {feature.premium ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {feature.enterprise ? (
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {(['basic', 'premium', 'enterprise'] as PackageTier[]).map((tier) => {
              const info = tierInfo[tier];
              const isCurrentTier = currentTier === tier;
              const canUpgrade = currentTier === 'basic' && tier !== 'basic' || 
                               currentTier === 'premium' && tier === 'enterprise';
              
              return (
                <Button
                  key={tier}
                  variant={isCurrentTier ? "outline" : canUpgrade ? "default" : "ghost"}
                  disabled={isCurrentTier || !canUpgrade}
                  onClick={() => canUpgrade ? onUpgrade(tier) : undefined}
                  className="h-12"
                >
                  {isCurrentTier ? 'Current Plan' : canUpgrade ? `Upgrade to ${info.name}` : info.name}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureComparisonModal;
