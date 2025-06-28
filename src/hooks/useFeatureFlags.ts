
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  description: string;
  organization_id: string | null;
  user_id: string | null;
  source?: 'global' | 'organization' | 'user';
}

export function useFeatureFlags() {
  const { getEffectiveOrganizationId } = useOrganization();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatureFlags();
  }, [getEffectiveOrganizationId]);

  const fetchFeatureFlags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const organizationId = getEffectiveOrganizationId();

      // Fetch all relevant feature flags with proper hierarchy
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${organizationId || 'null'},user_id.eq.${user.id}`);

      if (error) {
        console.error('Error fetching feature flags:', error);
        return;
      }

      // Process flags with priority: user > org > global
      const flagMap: Record<string, boolean> = {};
      const flagsByName: Record<string, FeatureFlag[]> = {};

      data?.forEach(flag => {
        if (!flagsByName[flag.flag_name]) {
          flagsByName[flag.flag_name] = [];
        }
        flagsByName[flag.flag_name].push(flag);
      });

      Object.entries(flagsByName).forEach(([flagName, flagList]) => {
        // Sort by specificity: user-specific, org-specific, global
        const sortedFlags = flagList.sort((a, b) => {
          if (a.user_id) return -1;
          if (b.user_id) return 1;
          if (a.organization_id) return -1;
          if (b.organization_id) return 1;
          return 0;
        });

        flagMap[flagName] = sortedFlags[0]?.is_enabled || false;
      });

      setFlags(flagMap);
    } catch (error) {
      console.error('Error in fetchFeatureFlags:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFeatureEnabled = (flagName: string): boolean => {
    return flags[flagName] || false;
  };

  return {
    flags,
    loading,
    isFeatureEnabled,
    refreshFlags: fetchFeatureFlags
  };
}

// Enhanced hook for individual feature flag checking with hierarchy
export function useFeatureFlag(flagName: string) {
  const { getEffectiveOrganizationId } = useOrganization();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'organization' | 'global' | null>(null);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      const organizationId = getEffectiveOrganizationId();
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Step 1: Check for organization-specific flag first
        const { data: orgFlag, error: orgError } = await supabase
          .from('feature_flags')
          .select('is_enabled, flag_name')
          .eq('flag_name', flagName)
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (orgError) throw orgError;

        // If organization-specific flag exists, use it
        if (orgFlag) {
          setIsEnabled(orgFlag.is_enabled);
          setSource('organization');
          return;
        }

        // Step 2: Fallback to global flag
        const { data: globalFlag, error: globalError } = await supabase
          .from('feature_flags')
          .select('is_enabled, flag_name')
          .eq('flag_name', flagName)
          .is('organization_id', null)
          .maybeSingle();

        if (globalError) throw globalError;

        if (globalFlag) {
          setIsEnabled(globalFlag.is_enabled);
          setSource('global');
          return;
        }

        // Step 3: Flag doesn't exist anywhere
        setIsEnabled(false);
        setSource(null);

      } catch (error) {
        console.error(`Error checking feature flag '${flagName}':`, error);
        setIsEnabled(false);
        setSource(null);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, [flagName, getEffectiveOrganizationId]);

  return { isEnabled, loading, source };
}

// Utility hook specifically for compound documents
export function useCompoundDocumentsEnabled() {
  const { isEnabled, loading, source } = useFeatureFlag('compound_documents_enabled');
  
  return {
    isEnabled,
    loading,
    source,
    isEnabledGlobally: source === 'global' && isEnabled,
    isEnabledForOrganization: source === 'organization' && isEnabled,
    isDisabled: !loading && !isEnabled
  };
}
