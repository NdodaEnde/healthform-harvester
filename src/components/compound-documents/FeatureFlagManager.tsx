
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle, Info } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { initializeBasicFeatureFlags } from '@/utils/initializeBasicFeatureFlags';

const FeatureFlagManager = () => {
  const { flags, refreshFlags, loading } = useFeatureFlags();
  const { getEffectiveOrganizationId } = useOrganization();
  const [updating, setUpdating] = useState<string | null>(null);

  const structuredExtractionFlags = [
    {
      key: 'extraction_comparison_tools',
      name: 'Extraction Comparison Tools',
      description: 'Enable side-by-side comparison of V1 vs V2 extraction methods',
      category: 'Testing Tools',
      recommended: true
    },
    {
      key: 'structured_extraction_rollout',
      name: 'Structured Extraction Rollout',
      description: 'Enable gradual rollout (25% of users get V2 extraction)',
      category: 'Rollout Control'
    },
    {
      key: 'structured_extraction_v2',
      name: 'Structured Extraction V2',
      description: 'Enable V2 extraction for all users (full migration)',
      category: 'Full Migration'
    }
  ];

  const initializeFlags = async () => {
    const organizationId = getEffectiveOrganizationId();
    if (!organizationId) return;

    setUpdating('initializing');
    try {
      await initializeBasicFeatureFlags(organizationId);
      await refreshFlags();
    } catch (error) {
      console.error('Error initializing flags:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleFlag = async (flagName: string, enabled: boolean) => {
    setUpdating(flagName);
    const organizationId = getEffectiveOrganizationId();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // First check if flag exists
      const { data: existingFlag } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('flag_name', flagName)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingFlag) {
        // Update existing flag
        await supabase
          .from('feature_flags')
          .update({ is_enabled: enabled })
          .eq('id', existingFlag.id);
      } else {
        // Create new flag
        await supabase
          .from('feature_flags')
          .insert({
            flag_name: flagName,
            is_enabled: enabled,
            organization_id: organizationId,
            description: structuredExtractionFlags.find(f => f.key === flagName)?.description
          });
      }

      await refreshFlags();
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Flag Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Structured Extraction Features
          <Badge variant="outline">Basic Plan</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Available on Basic Plan</span>
          </div>
          <p className="text-sm text-blue-700">
            Structured extraction features are now available on all plans. Start with comparison tools to test the differences.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Quick Setup</h3>
            <p className="text-sm text-gray-600">Initialize all structured extraction flags</p>
          </div>
          <Button 
            onClick={initializeFlags}
            disabled={updating === 'initializing'}
            variant="outline"
          >
            {updating === 'initializing' ? 'Setting up...' : 'Initialize Flags'}
          </Button>
        </div>

        {structuredExtractionFlags.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{flag.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {flag.category}
                </Badge>
                {flag.recommended && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Recommended
                  </Badge>
                )}
                {flags[flag.key] && (
                  <Zap className="h-3 w-3 text-green-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">{flag.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={flags[flag.key] || false}
                onCheckedChange={(checked) => toggleFlag(flag.key, checked)}
                disabled={updating === flag.key}
              />
              <Badge 
                variant={flags[flag.key] ? "default" : "secondary"}
                className={flags[flag.key] ? "bg-green-100 text-green-800" : ""}
              >
                {flags[flag.key] ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={refreshFlags}
            disabled={!!updating}
            className="w-full"
          >
            Refresh Flags
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureFlagManager;
