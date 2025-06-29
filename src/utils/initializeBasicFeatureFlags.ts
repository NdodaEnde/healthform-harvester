
import { supabase } from '@/integrations/supabase/client';

interface BasicFeatureFlag {
  flag_name: string;
  description: string;
  is_enabled: boolean;
}

const BASIC_FEATURE_FLAGS: BasicFeatureFlag[] = [
  {
    flag_name: 'structured_extraction_v2',
    description: 'Enable structured extraction V2 with improved AI processing',
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
    is_enabled: true // Enable testing tools by default
  }
];

export const initializeBasicFeatureFlags = async (organizationId: string) => {
  console.log('Initializing basic feature flags for organization:', organizationId);
  
  try {
    // Check which organization-specific flags already exist
    const { data: existingFlags } = await supabase
      .from('feature_flags')
      .select('flag_name')
      .eq('organization_id', organizationId)
      .in('flag_name', BASIC_FEATURE_FLAGS.map(f => f.flag_name));

    const existingFlagNames = existingFlags?.map(f => f.flag_name) || [];
    
    // Create organization-specific flags that don't exist yet
    const flagsToCreate = BASIC_FEATURE_FLAGS.filter(
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
        console.error('Error creating basic feature flags:', error);
        throw error;
      }

      console.log(`Created ${flagsToCreate.length} basic feature flags:`, flagsToCreate.map(f => f.flag_name));
      return { success: true, created: flagsToCreate.length };
    } else {
      console.log('All basic feature flags already exist for this organization');
      return { success: true, created: 0 };
    }
  } catch (error) {
    console.error('Error initializing basic flags:', error);
    return { success: false, error };
  }
};

export const enableExtractionComparison = async (organizationId: string) => {
  console.log('Enabling extraction comparison tools for organization:', organizationId);
  
  try {
    // First, ensure flags exist
    await initializeBasicFeatureFlags(organizationId);

    // Enable comparison tools
    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({ is_enabled: true })
      .eq('organization_id', organizationId)
      .eq('flag_name', 'extraction_comparison_tools');

    if (updateError) {
      console.error('Error enabling comparison tools:', updateError);
      throw updateError;
    }

    console.log('Successfully enabled extraction comparison tools');
    return { success: true };
  } catch (error) {
    console.error('Error enabling extraction comparison:', error);
    return { success: false, error };
  }
};
