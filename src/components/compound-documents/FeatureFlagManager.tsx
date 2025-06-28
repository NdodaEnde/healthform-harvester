
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, AlertTriangle } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const FeatureFlagManager = () => {
  const { flags, refreshFlags, loading } = useFeatureFlags();
  const { getEffectiveOrganizationId } = useOrganization();
  const [updating, setUpdating] = useState<string | null>(null);

  const compoundDocumentFlags = [
    {
      key: 'compound_documents_enabled',
      name: 'Compound Documents',
      description: 'Enable compound document processing and management',
      category: 'Core Features'
    },
    {
      key: 'compound_document_upload',
      name: 'Document Upload',
      description: 'Allow uploading of compound documents',
      category: 'Upload Features'
    },
    {
      key: 'ai_section_detection',
      name: 'AI Section Detection',
      description: 'Automatic AI-powered section detection',
      category: 'AI Features'
    },
    {
      key: 'workflow_management',
      name: 'Workflow Management',
      description: 'Advanced workflow assignment and tracking',
      category: 'Workflow Features'
    },
    {
      key: 'document_analytics',
      name: 'Document Analytics',
      description: 'Analytics and reporting for compound documents',
      category: 'Analytics Features'
    }
  ];

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
        .single();

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
            description: compoundDocumentFlags.find(f => f.key === flagName)?.description
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
          Feature Flag Manager
          <Badge variant="outline">Testing</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Testing Mode</span>
          </div>
          <p className="text-sm text-yellow-700">
            Use this panel to enable/disable compound document features for testing purposes.
          </p>
        </div>

        {compoundDocumentFlags.map((flag) => (
          <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{flag.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {flag.category}
                </Badge>
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
