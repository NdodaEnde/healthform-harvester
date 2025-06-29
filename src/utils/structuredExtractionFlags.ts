
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlagConfig {
  flag_name: string;
  description: string;
  is_enabled: boolean;
}

const STRUCTURED_EXTRACTION_FLAGS: FeatureFlagConfig[] = [
  {
    flag_name: 'structured_extraction_v2',
    description: 'Enable LandingAI structured extraction with JSON schemas',
    is_enabled: false // Start disabled for testing
  },
  {
    flag_name: 'structured_extraction_rollout',
    description: 'Enable gradual rollout of structured extraction (25% of users)',
    is_enabled: false // Start disabled for controlled rollout
  },
  {
    flag_name: 'extraction_comparison_tools',
    description: 'Enable tools for comparing V1 vs V2 extraction methods',
    is_enabled: true // Enable testing tools immediately
  }
];

export const initializeStructuredExtractionFlags = async (organizationId: string) => {
  console.log('Initializing structured extraction feature flags for organization:', organizationId);
  
  try {
    // Check which organization-specific flags already exist
    const { data: existingFlags } = await supabase
      .from('feature_flags')
      .select('flag_name')
      .eq('organization_id', organizationId)
      .in('flag_name', STRUCTURED_EXTRACTION_FLAGS.map(f => f.flag_name));

    const existingFlagNames = existingFlags?.map(f => f.flag_name) || [];
    
    // Create organization-specific flags that don't exist yet
    const flagsToCreate = STRUCTURED_EXTRACTION_FLAGS.filter(
      flag => !existingFlagNames.includes(flag.flag_name)
    );

    if (flagsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert(
          flagsToCreate.map(flag => ({
            flag_name: flag.flag_name,
            description: flag.description,
            is_enabled: flag.is_enabled,
            organization_id: organizationId
          }))
        );

      if (error) {
        console.error('Error creating structured extraction feature flags:', error);
        throw error;
      }

      console.log(`Created ${flagsToCreate.length} structured extraction feature flags:`, flagsToCreate.map(f => f.flag_name));
      return { success: true, created: flagsToCreate.length };
    } else {
      console.log('All structured extraction feature flags already exist for this organization');
      return { success: true, created: 0 };
    }
  } catch (error) {
    console.error('Error initializing structured extraction flags:', error);
    return { success: false, error };
  }
};

export const enableStructuredExtractionTesting = async (organizationId: string) => {
  console.log('Enabling structured extraction testing for organization:', organizationId);
  
  try {
    // First, ensure all flags exist
    await initializeStructuredExtractionFlags(organizationId);

    // Enable testing and comparison tools
    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({ is_enabled: true })
      .eq('organization_id', organizationId)
      .in('flag_name', ['extraction_comparison_tools']);

    if (updateError) {
      console.error('Error enabling testing features:', updateError);
      throw updateError;
    }

    console.log('Successfully enabled structured extraction testing features');
    return { success: true };
  } catch (error) {
    console.error('Error enabling structured extraction testing:', error);
    return { success: false, error };
  }
};

export const enableStructuredExtractionRollout = async (organizationId: string, percentage: number = 25) => {
  console.log(`Enabling structured extraction rollout (${percentage}%) for organization:`, organizationId);
  
  try {
    // Enable rollout flag
    const { error: rolloutError } = await supabase
      .from('feature_flags')
      .update({ is_enabled: true })
      .eq('organization_id', organizationId)
      .eq('flag_name', 'structured_extraction_rollout');

    if (rolloutError) {
      console.error('Error enabling rollout:', rolloutError);
      throw rolloutError;
    }

    console.log('Successfully enabled structured extraction rollout');
    return { success: true, rolloutPercentage: percentage };
  } catch (error) {
    console.error('Error enabling structured extraction rollout:', error);
    return { success: false, error };
  }
};

export const enableFullStructuredExtraction = async (organizationId: string) => {
  console.log('Enabling full structured extraction for organization:', organizationId);
  
  try {
    // Enable V2 for everyone
    const { error: v2Error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: true })
      .eq('organization_id', organizationId)
      .eq('flag_name', 'structured_extraction_v2');

    if (v2Error) {
      console.error('Error enabling V2:', v2Error);
      throw v2Error;
    }

    console.log('Successfully enabled full structured extraction');
    return { success: true };
  } catch (error) {
    console.error('Error enabling full structured extraction:', error);
    return { success: false, error };
  }
};
