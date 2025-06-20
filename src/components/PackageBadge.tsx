
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, Shield } from 'lucide-react';
import { PackageTier } from '@/types/subscription';

interface PackageBadgeProps {
  tier: PackageTier;
  className?: string;
}

const PackageBadge: React.FC<PackageBadgeProps> = ({ tier, className }) => {
  const getTierConfig = (packageTier: PackageTier) => {
    switch (packageTier) {
      case 'basic':
        return {
          label: 'Basic',
          icon: Shield,
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
      case 'premium':
        return {
          label: 'Premium',
          icon: Zap,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          icon: Crown,
          className: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      default:
        return {
          label: 'Basic',
          icon: Shield,
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const config = getTierConfig(tier);
  const IconComponent = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className || ''}`}
    >
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export default PackageBadge;
