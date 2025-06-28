
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  PlayCircle,
  StopCircle,
  RefreshCw
} from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useOrganization } from '@/contexts/OrganizationContext';
import { initializeCompoundDocumentFlags, enableAllCompoundDocumentFeatures } from '@/utils/featureFlagInitializer';
import { useToast } from '@/hooks/use-toast';

const FeatureFlagTestingPanel = () => {
  const { flags, refreshFlags, loading } = useFeatureFlags();
  const { getEffectiveOrganizationId } = useOrganization();
  const { toast } = useToast();
  const [initializing, setInitializing] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const compoundFeatures = [
    'compound_documents_enabled',
    'compound_document_upload',
    'ai_section_detection',
    'workflow_management',
    'document_analytics'
  ];

  const enabledFeatures = compoundFeatures.filter(feature => flags[feature]);
  const allEnabled = enabledFeatures.length === compoundFeatures.length;

  const handleInitializeFlags = async () => {
    setInitializing(true);
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No organization found. Please ensure you're logged in.",
        variant: "destructive"
      });
      setInitializing(false);
      return;
    }

    const result = await initializeCompoundDocumentFlags(organizationId);
    
    if (result.success) {
      toast({
        title: "Success",
        description: result.created > 0 
          ? `Created ${result.created} organization-specific feature flags (enabled by default).`
          : "All feature flags already exist for your organization.",
      });
      await refreshFlags();
    } else {
      toast({
        title: "Error",
        description: "Failed to initialize feature flags. Check console for details.",
        variant: "destructive"
      });
    }
    
    setInitializing(false);
  };

  const handleEnableAll = async () => {
    setEnabling(true);
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No organization found. Please ensure you're logged in.",
        variant: "destructive"
      });
      setEnabling(false);
      return;
    }

    const result = await enableAllCompoundDocumentFeatures(organizationId);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "All compound document features enabled for your organization!",
      });
      await refreshFlags();
    } else {
      toast({
        title: "Error",
        description: "Failed to enable features. Check console for details.",
        variant: "destructive"
      });
    }
    
    setEnabling(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Feature Flag Testing Panel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          Compound Documents Testing Panel
          <Badge variant={allEnabled ? "default" : "secondary"}>
            {enabledFeatures.length}/{compoundFeatures.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className={allEnabled ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <div className="flex items-center gap-2">
            {allEnabled ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${allEnabled ? 'text-green-800' : 'text-yellow-800'}`}>
              {allEnabled ? 'Ready for Testing!' : 'Setup Required'}
            </span>
          </div>
          <AlertDescription className={allEnabled ? 'text-green-700' : 'text-yellow-700'}>
            {allEnabled 
              ? 'All compound document features are enabled for your organization. You can now test the full workflow.'
              : 'Initialize and enable compound document features for your organization to start testing.'
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Feature Status (Organization-Specific)</h4>
          {compoundFeatures.map(feature => (
            <div key={feature} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">{feature.replace(/_/g, ' ').toLowerCase()}</span>
              <div className="flex items-center gap-2">
                {flags[feature] ? (
                  <Zap className="h-3 w-3 text-green-600" />
                ) : (
                  <StopCircle className="h-3 w-3 text-gray-400" />
                )}
                <Badge variant={flags[feature] ? "default" : "secondary"}>
                  {flags[feature] ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleInitializeFlags}
            disabled={initializing}
            variant="outline"
          >
            {initializing ? "Initializing..." : "Initialize Organization Flags"}
          </Button>
          
          <Button 
            onClick={handleEnableAll}
            disabled={enabling}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {enabling ? "Enabling..." : "Enable All Features"}
          </Button>

          <Button 
            onClick={refreshFlags}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {allEnabled && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Testing Checklist</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Visit /compound-documents to test document upload</li>
              <li>✅ Test section detection and editing</li>
              <li>✅ Try workflow assignment features</li>
              <li>✅ Check analytics at /analytics/compound-documents</li>
              <li>✅ Verify feature flag management in Settings</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagTestingPanel;
