
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlagConfig {
  flag_name: string;
  description: string;
  is_enabled: boolean;
}

const COMPOUND_DOCUMENT_FLAGS: FeatureFlagConfig[] = [
  {
    flag_name: 'compound_documents_enabled',
    description: 'Enable compound document processing and management',
    is_enabled: true
  },
  {
    flag_name: 'compound_document_upload',
    description: 'Allow uploading of compound documents',
    is_enabled: true
  },
  {
    flag_name: 'ai_section_detection',
    description: 'Automatic AI-powered section detection',
    is_enabled: true
  },
  {
    flag_name: 'workflow_management',
    description: 'Advanced workflow assignment and tracking',
    is_enabled: true
  },
  {
    flag_name: 'document_analytics',
    description: 'Analytics and reporting for compound documents',
    is_enabled: true
  }
];

export const initializeCompoundDocumentFlags = async (organizationId: string) => {
  console.log('Initializing compound document feature flags for organization:', organizationId);
  
  try {
    // Check which flags already exist
    const { data: existingFlags } = await supabase
      .from('feature_flags')
      .select('flag_name')
      .eq('organization_id', organizationId);

    const existingFlagNames = existingFlags?.map(f => f.flag_name) || [];
    
    // Create flags that don't exist yet
    const flagsToCreate = COMPOUND_DOCUMENT_FLAGS.filter(
      flag => !existingFlagNames.includes(flag.flag_name)
    );

    if (flagsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert(
          flagsToCreate.map(flag => ({
            ...flag,
            organization_id: organizationId
          }))
        );

      if (error) {
        console.error('Error creating feature flags:', error);
        throw error;
      }

      console.log(`Created ${flagsToCreate.length} feature flags:`, flagsToCreate.map(f => f.flag_name));
      return { success: true, created: flagsToCreate.length };
    } else {
      console.log('All compound document feature flags already exist');
      return { success: true, created: 0 };
    }
  } catch (error) {
    console.error('Error initializing feature flags:', error);
    return { success: false, error };
  }
};

export const enableAllCompoundDocumentFeatures = async (organizationId: string) => {
  console.log('Enabling all compound document features for organization:', organizationId);
  
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: true })
      .eq('organization_id', organizationId)
      .in('flag_name', COMPOUND_DOCUMENT_FLAGS.map(f => f.flag_name));

    if (error) {
      console.error('Error enabling feature flags:', error);
      throw error;
    }

    console.log('Successfully enabled all compound document features');
    return { success: true };
  } catch (error) {
    console.error('Error enabling compound document features:', error);
    return { success: false, error };
  }
};
