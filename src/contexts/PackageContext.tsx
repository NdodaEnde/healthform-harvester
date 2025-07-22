
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
  
  const packageData = useEnhancedPackage();
  console.log('Package data loaded:', packageData.currentTier);
  
  return (
    <PackageContext.Provider value={packageData}>
      {children}
    </PackageContext.Provider>
  );
}
