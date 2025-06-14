
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

    const { error } = await supabase
      .from('documents')
      .update({
        extracted_data: validatedData,
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
