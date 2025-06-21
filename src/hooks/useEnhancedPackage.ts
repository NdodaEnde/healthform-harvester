
import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { PackageConfigurationService, PackageConfiguration, MetricConfig, LanguageConfig, ColorConfig } from '@/services/PackageConfigurationService';
import { PackageTier, FeatureKey } from '@/types/subscription';

export interface EnhancedPackageHook {
  // Current package info
  currentTier: PackageTier;
  packageConfig: PackageConfiguration;
  
  // UI Configuration
  metrics: MetricConfig[];
  language: LanguageConfig;
  colors: ColorConfig;
  displayName: string;
  
  // Feature access
  hasFeature: (feature: FeatureKey) => boolean;
  canAccessFeature: (requiredTier: PackageTier) => boolean;
  getFeatureGate: (feature: FeatureKey) => {
    hasAccess: boolean;
    requiredTier?: PackageTier;
    upgradeConfig?: PackageConfiguration;
  };
  
  // Upgrade functionality
  upgradeTarget?: PackageTier;
  upgradePackage: (newTier: PackageTier) => Promise<boolean>;
  
  // Package comparison
  isBasic: boolean;
  isPremium: boolean;
  isEnterprise: boolean;
  
  // Loading states
  loading: boolean;
}

export const useEnhancedPackage = (): EnhancedPackageHook => {
  const { 
    currentTier, 
    hasFeature: originalHasFeature, 
    canAccessFeature: originalCanAccessFeature,
    upgradeSubscription,
    loading 
  } = useSubscription();

  // Get package configuration
  const packageConfig = useMemo(() => {
    return PackageConfigurationService.getConfig(currentTier);
  }, [currentTier]);

  // Extract configuration elements
  const metrics = useMemo(() => {
    return PackageConfigurationService.getMetrics(currentTier);
  }, [currentTier]);

  const language = useMemo(() => {
    return PackageConfigurationService.getLanguage(currentTier);
  }, [currentTier]);

  const colors = useMemo(() => {
    return PackageConfigurationService.getColors(currentTier);
  }, [currentTier]);

  const displayName = useMemo(() => {
    return PackageConfigurationService.getDisplayName(currentTier);
  }, [currentTier]);

  // Enhanced feature access functions
  const hasFeature = useMemo(() => {
    return (feature: FeatureKey) => {
      return PackageConfigurationService.hasFeature(currentTier, feature);
    };
  }, [currentTier]);

  const canAccessFeature = useMemo(() => {
    return (requiredTier: PackageTier) => {
      return originalCanAccessFeature(requiredTier);
    };
  }, [originalCanAccessFeature]);

  const getFeatureGate = useMemo(() => {
    return (feature: FeatureKey) => {
      const gateConfig = PackageConfigurationService.getFeatureGateConfig(currentTier, feature);
      return gateConfig || { hasAccess: false };
    };
  }, [currentTier]);

  // Package type checks
  const isBasic = currentTier === 'basic';
  const isPremium = currentTier === 'premium';
  const isEnterprise = currentTier === 'enterprise';

  // Upgrade functionality
  const upgradeTarget = PackageConfigurationService.getUpgradeTarget(currentTier);
  
  const upgradePackage = async (newTier: PackageTier): Promise<boolean> => {
    try {
      return await upgradeSubscription(newTier);
    } catch (error) {
      console.error('Failed to upgrade package:', error);
      return false;
    }
  };

  return {
    // Current package info
    currentTier,
    packageConfig,
    
    // UI Configuration
    metrics,
    language,
    colors,
    displayName,
    
    // Feature access
    hasFeature,
    canAccessFeature,
    getFeatureGate,
    
    // Upgrade functionality
    upgradeTarget,
    upgradePackage,
    
    // Package comparison
    isBasic,
    isPremium,
    isEnterprise,
    
    // Loading states
    loading
  };
};
