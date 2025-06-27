
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Settings, CheckCircle } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const FeatureFlagBanner = () => {
  const { flags, loading, isFeatureEnabled } = useFeatureFlags();

  if (loading) return null;

  // Show banner if any compound document features are enabled
  const compoundFeatures = [
    'compound_documents_enabled',
    'compound_document_upload',
    'workflow_management',
    'ai_section_detection'
  ];

  const enabledFeatures = compoundFeatures.filter(feature => isFeatureEnabled(feature));

  if (enabledFeatures.length === 0) return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Zap className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Beta Features Active:</strong> You have access to new compound document features.
            <div className="flex gap-2 mt-2">
              {enabledFeatures.map(feature => (
                <Badge 
                  key={feature} 
                  variant="outline" 
                  className="bg-blue-100 text-blue-700 border-blue-300"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {feature.replace('_', ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="ml-4">
            <Settings className="h-4 w-4 mr-1" />
            Manage Features
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default FeatureFlagBanner;
