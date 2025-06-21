
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Lock, Zap, Crown, ArrowRight } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier, FeatureKey } from '@/types/subscription';
import UpgradeFlowModal from '@/components/UpgradeFlowModal';

interface PreviewFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  previewContent?: React.ReactNode;
  title: string;
  description: string;
  previewTitle?: string;
  className?: string;
}

const PreviewFeatureGate: React.FC<PreviewFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  previewContent,
  title,
  description,
  previewTitle,
  className
}) => {
  const { getFeatureGate, canAccessFeature, colors } = usePackage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Determine access
  let hasAccess = true;
  if (feature) {
    const gateConfig = getFeatureGate(feature);
    hasAccess = gateConfig.hasAccess;
  } else if (requiredTier) {
    hasAccess = canAccessFeature(requiredTier);
  }

  if (hasAccess) {
    return <div className={className}>{children}</div>;
  }

  const targetTier = requiredTier || 'premium';
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

  return (
    <>
      <Card className={`border-2 border-dashed ${colors.border} relative overflow-hidden ${className}`}>
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm z-10" />
        
        {/* Blurred preview content */}
        <div className="blur-sm opacity-30">
          {previewContent || children}
        </div>
        
        {/* Overlay content */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <Card className="max-w-sm mx-4 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 rounded-full bg-white shadow-md w-fit">
                <TierIcon className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="flex justify-center">
                <Badge variant="outline" className={tierColors[targetTier]}>
                  {targetTier.toUpperCase()} REQUIRED
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{description}</p>
              
              <div className="flex gap-2">
                {previewContent && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{previewTitle || `${title} Preview`}</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {previewContent}
                      </div>
                      <div className="flex justify-center pt-4 border-t">
                        <Button onClick={() => setShowUpgradeModal(true)}>
                          Upgrade to Access
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button 
                  onClick={() => setShowUpgradeModal(true)} 
                  size="sm" 
                  className="flex-1"
                >
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>
      
      <UpgradeFlowModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        targetTier={targetTier}
      />
    </>
  );
};

export default PreviewFeatureGate;
