
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
  console.log('useEnhancedPackage called');
  
  // Use subscription hook with better error handling
  const subscriptionHook = useSubscription();
  console.log('Subscription hook loaded:', subscriptionHook.currentTier);
  
  const { 
    currentTier, 
    hasFeature: originalHasFeature, 
    canAccessFeature: originalCanAccessFeature,
    upgradeSubscription,
    loading 
  } = subscriptionHook;

  // Get package configuration with error handling
  const packageConfig = useMemo(() => {
    try {
      return PackageConfigurationService.getConfig(currentTier);
    } catch (error) {
      console.error('Error getting package config:', error);
      return PackageConfigurationService.getConfig('basic');
    }
  }, [currentTier]);

  // Extract configuration elements with error handling
  const metrics = useMemo(() => {
    try {
      return PackageConfigurationService.getMetrics(currentTier);
    } catch (error) {
      console.error('Error getting metrics:', error);
      return [];
    }
  }, [currentTier]);

  const language = useMemo(() => {
    try {
      return PackageConfigurationService.getLanguage(currentTier);
    } catch (error) {
      console.error('Error getting language:', error);
      return {
        dashboardTitle: 'Dashboard',
        executiveSummaryTitle: 'Summary',
        executiveSummaryDescription: 'Basic overview',
        upgradePromptTitle: 'Upgrade',
        upgradePromptDescription: 'Upgrade for more features',
        featuresTitle: 'Features'
      };
    }
  }, [currentTier]);

  const colors = useMemo(() => {
    try {
      return PackageConfigurationService.getColors(currentTier);
    } catch (error) {
      console.error('Error getting colors:', error);
      return {
        primary: 'bg-blue-600',
        accent: 'text-blue-600',
        background: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      };
    }
  }, [currentTier]);

  const displayName = useMemo(() => {
    try {
      return PackageConfigurationService.getDisplayName(currentTier);
    } catch (error) {
      console.error('Error getting display name:', error);
      return 'Basic';
    }
  }, [currentTier]);

  // Enhanced feature access functions
  const hasFeature = useMemo(() => {
    return (feature: FeatureKey) => {
      try {
        return PackageConfigurationService.hasFeature(currentTier, feature);
      } catch (error) {
        console.error('Error checking feature:', error);
        return false;
      }
    };
  }, [currentTier]);

  const canAccessFeature = useMemo(() => {
    return (requiredTier: PackageTier) => {
      try {
        return originalCanAccessFeature(requiredTier);
      } catch (error) {
        console.error('Error checking tier access:', error);
        return false;
      }
    };
  }, [originalCanAccessFeature]);

  const getFeatureGate = useMemo(() => {
    return (feature: FeatureKey) => {
      try {
        const gateConfig = PackageConfigurationService.getFeatureGateConfig(currentTier, feature);
        return gateConfig || { hasAccess: false };
      } catch (error) {
        console.error('Error getting feature gate:', error);
        return { hasAccess: false };
      }
    };
  }, [currentTier]);

  // Package type checks
  const isBasic = currentTier === 'basic';
  const isPremium = currentTier === 'premium';
  const isEnterprise = currentTier === 'enterprise';

  // Upgrade functionality
  const upgradeTarget = useMemo(() => {
    try {
      return PackageConfigurationService.getUpgradeTarget(currentTier);
    } catch (error) {
      console.error('Error getting upgrade target:', error);
      return undefined;
    }
  }, [currentTier]);
  
  const upgradePackage = async (newTier: PackageTier): Promise<boolean> => {
    try {
      return await upgradeSubscription(newTier);
    } catch (error) {
      console.error('Failed to upgrade package:', error);
      return false;
    }
  };

  const result = {
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

  console.log('Enhanced package hook result:', result);
  return result;
};
