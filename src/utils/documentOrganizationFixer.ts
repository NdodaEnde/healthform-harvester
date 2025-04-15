
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a file will require SDK processing based on size and type
 * @param file The file to check
 * @returns Boolean indicating if SDK processing will be used
 */
export function willRequireSDKProcessing(file: File): boolean {
  // Check if this is a large document that would require SDK processing
  const isPdf = file.type.includes('pdf');
  const isLargeDocument = file.size > 5000000; // 5MB threshold
  
  return isPdf && isLargeDocument;
}

/**
 * Get estimated processing time for a document
 * @param file The file to process
 * @returns Estimated seconds for processing
 */
export function getEstimatedProcessingTime(file: File): number {
  const isPdf = file.type.includes('pdf');
  const isLargeDocument = file.size > 5000000; // 5MB threshold
  
  if (isPdf && isLargeDocument) {
    // For large PDFs that require SDK processing
    return Math.min(300, Math.max(60, Math.floor(file.size / 50000))); // 60-300 seconds based on size
  } else if (isPdf) {
    // For normal PDFs
    return Math.min(120, Math.max(30, Math.floor(file.size / 100000))); // 30-120 seconds based on size
  } else {
    // For images and other documents
    return Math.min(60, Math.max(15, Math.floor(file.size / 200000))); // 15-60 seconds based on size
  }
}

/**
 * Associate orphaned documents with an organization
 * @param organizationId The organization ID to associate documents with
 * @returns Object containing success status and count of fixed documents
 */
export async function associateOrphanedDocuments(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ organization_id: organizationId })
      .is('organization_id', null)
      .select();

    if (error) throw error;

    return {
      success: true,
      count: data?.length || 0
    };
  } catch (error) {
    console.error('Error associating orphaned documents:', error);
    return {
      success: false,
      count: 0
    };
  }
}
