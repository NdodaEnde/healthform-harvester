
import React from 'react';
import EnhancedFeatureGate from '@/components/EnhancedFeatureGate';
import UpgradePromptCard from '@/components/UpgradePromptCard';
import { usePackage } from '@/contexts/PackageContext';
import { FeatureKey, PackageTier } from '@/types/subscription';

interface EmployeesFeatureGateProps {
  feature?: FeatureKey;
  requiredTier?: PackageTier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  employeeFeatures?: string[];
  className?: string;
}

const EmployeesFeatureGate: React.FC<EmployeesFeatureGateProps> = ({
  feature,
  requiredTier,
  children,
  title,
  description,
  employeeFeatures,
  className
}) => {
  const { colors } = usePackage();

  const defaultEmployeeFeatures = {
    premium: [
      'Advanced employee profiles',
      'Batch employee operations',
      'Employee health analytics',
      'Custom employee fields',
      'Employee performance tracking'
    ],
    enterprise: [
      'Multi-department management',
      'Employee API access',
      'Advanced employee workflows',
      'Employee benchmarking',
      'Custom employee integrations'
    ]
  };

  const targetTier = requiredTier || 'premium';
  const features = employeeFeatures || defaultEmployeeFeatures[targetTier as keyof typeof defaultEmployeeFeatures] || [];

  const employeesUpgradeFallback = (
    <UpgradePromptCard
      targetTier={targetTier}
      title={title || `${targetTier === 'premium' ? 'Premium' : 'Enterprise'} Employee Management Required`}
      description={description || `Access advanced employee management with ${targetTier} features.`}
      features={features}
      className={className}
    />
  );

  return (
    <EnhancedFeatureGate
      feature={feature}
      requiredTier={requiredTier}
      fallback={employeesUpgradeFallback}
      showUpgradePrompt={false}
      className={className}
    >
      {children}
    </EnhancedFeatureGate>
  );
};

export default EmployeesFeatureGate;
