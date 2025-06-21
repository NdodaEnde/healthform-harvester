
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier, FeatureKey } from '@/types/subscription';
import UpgradeFlowModal from '@/components/UpgradeFlowModal';

interface FeatureDiscoveryTooltipProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title: string;
  description: string;
  benefits?: string[];
  className?: string;
}

const FeatureDiscoveryTooltip: React.FC<FeatureDiscoveryTooltipProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  benefits = [],
  className
}) => {
  const { getFeatureGate, canAccessFeature } = usePackage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check access
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            {children}
            <div className="absolute -top-1 -right-1">
              <div className="animate-pulse">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-sm p-4 bg-white shadow-lg border-2"
          sideOffset={10}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Badge variant="outline" className="text-xs">
                {targetTier.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground">{description}</p>
            
            {benefits.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Benefits:</p>
                <ul className="text-xs space-y-1">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button 
              size="sm" 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full text-xs h-8"
            >
              Unlock Feature
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
      
      <UpgradeFlowModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        targetTier={targetTier}
      />
    </TooltipProvider>
  );
};

export default FeatureDiscoveryTooltip;
