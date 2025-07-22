
import React, { createContext, useContext, ReactNode } from 'react';
import { useEnhancedPackage, EnhancedPackageHook } from '@/hooks/useEnhancedPackage';

const PackageContext = createContext<EnhancedPackageHook | undefined>(undefined);

export function usePackage() {
  const context = useContext(PackageContext);
  if (context === undefined) {
    throw new Error('usePackage must be used within a PackageProvider');
  }
  return context;
}

export function useOptionalPackage() {
  return useContext(PackageContext);
}

interface PackageProviderProps {
  children: ReactNode;
}

export function PackageProvider({ children }: PackageProviderProps) {
  console.log('PackageProvider rendering...');
  
  try {
    const packageData = useEnhancedPackage();
    console.log('Package data loaded:', packageData.currentTier);
    
    return (
      <PackageContext.Provider value={packageData}>
        {children}
      </PackageContext.Provider>
    );
  } catch (error) {
    console.error('Error in PackageProvider:', error);
    // Return a fallback context to prevent the app from crashing
    const fallbackData = {
      currentTier: 'basic' as const,
      packageConfig: {
        tier: 'basic' as const,
        displayName: 'Basic',
        metrics: [],
        language: {
          dashboardTitle: 'Dashboard',
          executiveSummaryTitle: 'Summary',
          executiveSummaryDescription: 'Basic overview',
          upgradePromptTitle: 'Upgrade',
          upgradePromptDescription: 'Upgrade for more features',
          featuresTitle: 'Features'
        },
        colors: {
          primary: 'bg-blue-600',
          accent: 'text-blue-600',
          background: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800'
        },
        features: []
      },
      metrics: [],
      language: {
        dashboardTitle: 'Dashboard',
        executiveSummaryTitle: 'Summary',
        executiveSummaryDescription: 'Basic overview',
        upgradePromptTitle: 'Upgrade',
        upgradePromptDescription: 'Upgrade for more features',
        featuresTitle: 'Features'
      },
      colors: {
        primary: 'bg-blue-600',
        accent: 'text-blue-600',
        background: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800'
      },
      displayName: 'Basic',
      hasFeature: () => false,
      canAccessFeature: () => false,
      getFeatureGate: () => ({ hasAccess: false }),
      upgradePackage: async () => false,
      isBasic: true,
      isPremium: false,
      isEnterprise: false,
      loading: false
    };
    
    return (
      <PackageContext.Provider value={fallbackData}>
        {children}
      </PackageContext.Provider>
    );
  }
}
