
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Uploads an organization asset (logo, signature, stamp) to Supabase storage
 * and returns the public URL
 */
export const uploadOrganizationAsset = async (
  file: File,
  organizationId: string,
  assetType: 'logo' | 'signature' | 'stamp'
): Promise<string | null> => {
  try {
    if (!file || !organizationId) return null;
    
    // Create a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-${assetType}-${Date.now()}.${fileExt}`;
    const filePath = `organizations/${organizationId}/${fileName}`;
    
    // Upload file to storage
    const { error: uploadError } = await supabase
      .storage
      .from('organization-assets')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get public URL for the uploaded file
    const { data } = supabase
      .storage
      .from('organization-assets')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error: any) {
    console.error(`Error uploading ${assetType}:`, error);
    toast({
      title: `Upload Failed`,
      description: `Failed to upload ${assetType}: ${error.message}`,
      variant: "destructive"
    });
    return null;
  }
};

/**
 * Deletes an organization asset from Supabase storage
 */
export const deleteOrganizationAsset = async (
  assetUrl: string,
  organizationId: string
): Promise<boolean> => {
  try {
    if (!assetUrl || !organizationId) return false;
    
    // Extract the file path from the URL
    const urlObj = new URL(assetUrl);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const filePath = `organizations/${organizationId}/${fileName}`;
    
    // Delete the file from storage
    const { error } = await supabase
      .storage
      .from('organization-assets')
      .remove([filePath]);
      
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error deleting asset:", error);
    toast({
      title: "Deletion Failed",
      description: `Failed to delete asset: ${error.message}`,
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Updates an organization's asset URLs in the database
 */
export const updateOrganizationAssets = async (
  organizationId: string,
  updates: {
    logo_url?: string;
    signature_url?: string;
    stamp_url?: string;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId);
      
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error("Error updating organization assets:", error);
    toast({
      title: "Update Failed",
      description: `Failed to update organization assets: ${error.message}`,
      variant: "destructive"
    });
    return false;
  }
};
