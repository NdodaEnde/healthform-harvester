
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown } from 'lucide-react';
import { PackageTier } from '@/types/subscription';

interface PackageBadgeProps {
  tier: PackageTier;
  size?: 'sm' | 'md';
}

const PackageBadge: React.FC<PackageBadgeProps> = ({ tier, size = 'sm' }) => {
  const tierConfig = {
    basic: {
      icon: Lock,
      label: 'Basic',
      className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    },
    premium: {
      icon: Zap,
      label: 'Premium',
      className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    },
    enterprise: {
      icon: Crown,
      label: 'Enterprise',
      className: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    }
  };

  const config = tierConfig[tier];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge className={config.className} variant="secondary">
      <Icon className={`${iconSize} mr-1`} />
      {config.label}
    </Badge>
  );
};

export default PackageBadge;
