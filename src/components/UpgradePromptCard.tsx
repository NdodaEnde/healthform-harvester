
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePackage } from '@/contexts/PackageContext';
import { PackageTier } from '@/types/subscription';
import { Zap, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradePromptCardProps {
  targetTier?: PackageTier;
  title?: string;
  description?: string;
  features?: string[];
  className?: string;
  variant?: 'default' | 'compact' | 'banner';
}

const UpgradePromptCard: React.FC<UpgradePromptCardProps> = ({
  targetTier,
  title,
  description,
  features = [],
  className,
  variant = 'default'
}) => {
  const { currentTier, upgradePackage, upgradeTarget, displayName } = usePackage();

  const effectiveTargetTier = targetTier || upgradeTarget || 'premium';
  
  const tierConfig = {
    premium: {
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      price: '$299/month',
      defaultFeatures: [
        'AI-powered health intelligence',
        'Advanced trend analysis',
        'Risk intelligence dashboard',
        'Custom branded reports',
        'Department-level analytics'
      ]
    },
    enterprise: {
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      price: '$999/month',
      defaultFeatures: [
        'Strategic command center',
        'Competitive benchmarking',
        'Custom business KPIs',
        'API access & integrations',
        'White-label solutions'
      ]
    }
  };

  const config = tierConfig[effectiveTargetTier as keyof typeof tierConfig];
  if (!config) return null;

  const IconComponent = config.icon;
  const displayFeatures = features.length > 0 ? features : config.defaultFeatures;

  const handleUpgrade = async () => {
    toast.loading(`Upgrading to ${effectiveTargetTier}...`);
    const success = await upgradePackage(effectiveTargetTier);
    
    if (success) {
      toast.success(`Successfully upgraded to ${effectiveTargetTier}!`);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Upgrade failed. Please try again.');
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={`${config.borderColor} ${config.bgColor} ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className={`h-5 w-5 ${config.color}`} />
              <div>
                <h4 className="font-medium">
                  {title || `Upgrade to ${effectiveTargetTier}`}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {description || `Unlock ${effectiveTargetTier} features`}
                </p>
              </div>
            </div>
            <Button size="sm" className={config.buttonColor} onClick={handleUpgrade}>
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <Card className={`${config.borderColor} ${config.bgColor} ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-white ${config.borderColor} border`}>
                <IconComponent className={`h-6 w-6 ${config.color}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {title || `Ready for ${effectiveTargetTier}?`}
                  <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
                    {effectiveTargetTier.toUpperCase()}
                  </Badge>
                </h3>
                <p className="text-muted-foreground">
                  {description || `Unlock advanced features and insights with ${effectiveTargetTier}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-lg font-bold">{config.price}</span>
              <Button className={config.buttonColor} onClick={handleUpgrade}>
                Upgrade Now <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${config.borderColor} ${config.bgColor} ${className}`}>
      <CardHeader className="text-center">
        <div className={`mx-auto mb-2 p-3 rounded-full bg-white ${config.borderColor} border w-fit`}>
          <IconComponent className={`h-6 w-6 ${config.color}`} />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          {title || `Upgrade to ${effectiveTargetTier}`}
          <Badge variant="outline" className={`${config.bgColor} ${config.color}`}>
            {effectiveTargetTier.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          {description || `Unlock powerful ${effectiveTargetTier} features and take your health analytics to the next level.`}
        </p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-center">What you'll get:</h4>
          <ul className="space-y-1 text-sm">
            {displayFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Sparkles className={`h-3 w-3 ${config.color}`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center space-y-3">
          <div className="text-lg font-bold">{config.price}</div>
          <Button className={`w-full ${config.buttonColor}`} onClick={handleUpgrade}>
            Upgrade to {effectiveTargetTier} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Currently on: <span className="font-medium capitalize">{displayName}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePromptCard;
