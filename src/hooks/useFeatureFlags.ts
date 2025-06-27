
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

      // Fetch all relevant feature flags
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
