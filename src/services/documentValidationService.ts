import { supabase } from '@/integrations/supabase/client';

export const saveValidatedData = async (
  documentId: string, 
  validatedData: any, 
  selectedTemplate?: 'modern' | 'historical'
) => {
  try {
    console.log('Saving validated data for document:', documentId);
    console.log('Validated data:', validatedData);
    console.log('Selected template:', selectedTemplate);
    
    // Get current document to preserve template selection and original data
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      throw new Error('Failed to fetch current document data');
    }

    const currentExtractedData = currentDoc.extracted_data as any;
    
    // 🔧 FIX: Preserve template selection and original detection data
    const updatedExtractedData = {
      ...currentExtractedData,
      structured_data: validatedData,
      // Preserve the original raw_content that contains signature/stamp info
      raw_content: currentExtractedData.raw_content,
      // 🎯 CRITICAL: Save the current template selection if provided
      ...(selectedTemplate && {
        template_selection: {
          selected_template: selectedTemplate,
          manually_selected: true,
          saved_at: new Date().toISOString(),
          preserved_signature_data: !!(
            currentExtractedData.structured_data?.certificate_info?.signature ||
            currentExtractedData.raw_content?.toLowerCase()?.includes('signature')
          ),
          preserved_stamp_data: !!(
            currentExtractedData.structured_data?.certificate_info?.stamp ||
            currentExtractedData.raw_content?.toLowerCase()?.includes('stamp')
          )
        }
      }),
      // Mark as validated
      validation_status: 'validated',
      validated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('documents')
      .update({
        extracted_data: updatedExtractedData,
        validation_status: 'validated',
        validated_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Successfully saved validated data with template:', selectedTemplate);
    return { error: null };

  } catch (error) {
    console.error('Error saving validated data:', error);
    return { error };
  }
};