
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptionalOrganization } from '@/contexts/OrganizationContext';
import { PackageTier, PACKAGE_FEATURES, FeatureKey } from '@/types/subscription';

interface SubscriptionData {
  package_tier: PackageTier;
  status: string;
  trial_end?: string;
  current_period_end?: string;
}

export const useSubscription = () => {
  const organizationContext = useOptionalOrganization();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      // If no organization context is available, provide safe defaults
      if (!organizationContext || !organizationContext.currentOrganization?.id) {
        console.log('[useSubscription] No organization context available, using basic defaults');
        setSubscription({
          package_tier: 'basic',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        const { currentOrganization } = organizationContext;
        
        // Check if the organization has subscription info in settings
        const settings = currentOrganization.settings as any;
        const subscriptionData = settings?.subscription;

        if (subscriptionData) {
          setSubscription(subscriptionData);
        } else {
          // Default to basic package
          setSubscription({
            package_tier: 'basic',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Fallback to basic
        setSubscription({
          package_tier: 'basic',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [organizationContext?.currentOrganization]);

  const hasFeature = (feature: FeatureKey): boolean => {
    if (!subscription) return false;
    return PACKAGE_FEATURES[subscription.package_tier]?.includes(feature) || false;
  };

  const canAccessFeature = (requiredTier: PackageTier): boolean => {
    if (!subscription) return false;
    
    const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const currentTierLevel = tierHierarchy[subscription.package_tier];
    const requiredTierLevel = tierHierarchy[requiredTier];
    
    return currentTierLevel >= requiredTierLevel;
  };

  const upgradeSubscription = async (newTier: PackageTier) => {
    // Check if organization context is available
    if (!organizationContext?.currentOrganization?.id) {
      console.warn('[useSubscription] Cannot upgrade subscription: no organization context');
      return false;
    }

    try {
      const { currentOrganization } = organizationContext;
      const settings = (currentOrganization.settings as any) || {};
      const updatedSettings = {
        ...settings,
        subscription: {
          ...subscription,
          package_tier: newTier,
          status: 'active'
        }
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, package_tier: newTier } : null);
      return true;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return false;
    }
  };

  return {
    subscription,
    loading,
    hasFeature,
    canAccessFeature,
    upgradeSubscription,
    currentTier: subscription?.package_tier || 'basic'
  };
};
