
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier } from '@/types/subscription';
import UpgradeFlowModal from '@/components/UpgradeFlowModal';

interface UpgradePromptCardProps {
  targetTier: PackageTier;
  title?: string;
  description?: string;
  features?: string[];
  variant?: 'card' | 'banner' | 'compact';
  className?: string;
}

const UpgradePromptCard: React.FC<UpgradePromptCardProps> = ({
  targetTier,
  title,
  description,
  features = [],
  variant = 'card',
  className = ''
}) => {
  const { colors, currentTier } = usePackage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tierInfo = {
    premium: {
      name: 'Premium',
      icon: Zap,
      gradient: 'from-yellow-500 to-orange-500',
      price: '$299/month'
    },
    enterprise: {
      name: 'Enterprise', 
      icon: Crown,
      gradient: 'from-purple-500 to-pink-500',
      price: '$999/month'
    }
  };

  const info = tierInfo[targetTier as keyof typeof tierInfo];
  if (!info) return null;

  const IconComponent = info.icon;

  const defaultFeatures = {
    premium: [
      'AI-powered health intelligence',
      'Advanced analytics & reporting',
      'Department-level insights',
      'Custom branding options'
    ],
    enterprise: [
      'Strategic command center',
      'Competitive benchmarking', 
      'API access & integrations',
      'White-label capabilities'
    ]
  };

  const displayFeatures = features.length > 0 ? features : defaultFeatures[targetTier as keyof typeof defaultFeatures] || [];

  if (variant === 'banner') {
    return (
      <>
        <Card className={`border-2 border-dashed ${colors.border} bg-gradient-to-r ${info.gradient} bg-opacity-5 ${className}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full bg-gradient-to-r ${info.gradient} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {title || `Unlock ${info.name} Features`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {description || `Upgrade to ${info.name} for advanced capabilities`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {info.price}
                </Badge>
                <Button onClick={() => setShowUpgradeModal(true)}>
                  Upgrade Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <UpgradeFlowModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          targetTier={targetTier}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center justify-between p-4 border rounded-lg ${colors.background} ${className}`}>
          <div className="flex items-center gap-3">
            <IconComponent className={`h-5 w-5 ${colors.accent}`} />
            <div>
              <span className="text-sm font-medium">{info.name} Required</span>
              <p className="text-xs text-muted-foreground">{info.price}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
            Upgrade
          </Button>
        </div>
        
        <UpgradeFlowModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          targetTier={targetTier}
        />
      </>
    );
  }

  return (
    <>
      <Card className={`border-2 border-dashed ${colors.border} ${className}`}>
        <CardHeader className="text-center pb-4">
          <div className={`mx-auto mb-3 p-4 rounded-full bg-gradient-to-r ${info.gradient} text-white w-fit`}>
            <IconComponent className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">
            {title || `Unlock ${info.name} Features`}
          </CardTitle>
          <div className="flex justify-center">
            <Badge variant="outline" className={`${colors.background} ${colors.border} ${colors.accent}`}>
              {info.name.toUpperCase()} - {info.price}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            {description || `Upgrade to ${info.name} to unlock advanced capabilities and insights.`}
          </p>
          
          {displayFeatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                What you'll get:
              </h4>
              <ul className="space-y-1">
                {displayFeatures.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Learn More
            </Button>
            <Button onClick={() => setShowUpgradeModal(true)} size="sm" className="flex-1">
              Upgrade to {info.name}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Currently on: <span className="font-medium capitalize">{currentTier}</span>
          </p>
        </CardContent>
      </Card>
      
      <UpgradeFlowModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        targetTier={targetTier}
      />
    </>
  );
};

export default UpgradePromptCard;
