
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

interface UpgradeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier: PackageTier;
}

const UpgradeFlowModal: React.FC<UpgradeFlowModalProps> = ({
  isOpen,
  onClose,
  targetTier
}) => {
  const { upgradePackage, currentTier, colors } = usePackage();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const tierInfo = {
    premium: {
      name: 'Premium',
      price: '$299',
      icon: Zap,
      color: 'text-yellow-600',
      features: [
        'AI-powered health intelligence',
        'Advanced analytics & reporting',
        'Department-level breakdowns', 
        'Custom branding options',
        'Automated scheduling',
        'Risk intelligence insights'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: '$999',
      icon: Crown,
      color: 'text-purple-600',
      features: [
        'Everything in Premium',
        'Competitive benchmarking',
        'Strategic command center',
        'API access & integrations',
        'White-label reports',
        'Dedicated support',
        'Custom business KPIs'
      ]
    }
  };

  const info = tierInfo[targetTier as keyof typeof tierInfo];
  const IconComponent = info?.icon || Zap;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const success = await upgradePackage(targetTier);
      if (success) {
        toast({
          title: "Upgrade Successful!",
          description: `Welcome to ${info?.name}! Your new features are now available.`,
          variant: "default"
        });
        onClose();
        // Refresh to show new features
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({
          title: "Upgrade Failed",
          description: "There was an issue processing your upgrade. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Error",
        description: "An unexpected error occurred. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!info) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-6 w-6 ${info.color}`} />
            Upgrade to {info.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{info.name} Plan</CardTitle>
                <Badge variant="outline" className={info.color}>
                  {info.price}/month
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {info.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUpgrading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1"
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                `Upgrade to ${info.name}`
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Currently on: <span className="font-medium capitalize">{currentTier}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeFlowModal;
