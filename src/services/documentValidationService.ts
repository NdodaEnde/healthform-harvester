
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseDocument } from '@/types/database';

export interface ValidationData {
  [key: string]: any;
}

export const saveValidatedData = async (
  documentId: string,
  validatedData: ValidationData
): Promise<{ error: Error | null }> => {
  try {
    console.log('Saving validated data for document:', documentId);
    console.log('Validated data:', validatedData);

    // First, get the current document to preserve original extracted_data structure
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      console.error('Error fetching current document:', fetchError);
      return { error: fetchError };
    }

    // Preserve the original extracted_data structure and merge with validated data
    const originalExtractedData = currentDoc.extracted_data || {};
    
    // Create a merged structure that preserves signature/stamp detection data
    const mergedExtractedData = {
      ...originalExtractedData,
      // Preserve original raw_content and any detection markers
      raw_content: originalExtractedData.raw_content,
      structured_data: {
        ...originalExtractedData.structured_data,
        // Update with validated data while preserving certificate_info signatures/stamps
        certificate_info: {
          ...originalExtractedData.structured_data?.certificate_info,
          // Preserve signature and stamp detection markers
          signature: originalExtractedData.structured_data?.certificate_info?.signature,
          stamp: originalExtractedData.structured_data?.certificate_info?.stamp,
        },
        // Merge other validated data
        ...validatedData
      },
      // Also store the validated data at the root level for compatibility
      ...validatedData
    };

    console.log('Merged extracted data:', mergedExtractedData);

    const { error } = await supabase
      .from('documents')
      .update({
        extracted_data: mergedExtractedData,
        validation_status: 'validated',
        validated_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error saving validated data:', error);
      return { error };
    }

    console.log('Successfully saved validated data');
    return { error: null };
  } catch (err) {
    console.error('Unexpected error saving validated data:', err);
    return { error: err as Error };
  }
};
