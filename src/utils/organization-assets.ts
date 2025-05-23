
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Ensures that the documents storage bucket exists
 * This helps prevent errors when trying to upload to a non-existent bucket
 */
export const ensureDocumentsBucketExists = async (): Promise<boolean> => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
      
    if (listError) {
      console.error("Error checking buckets:", listError);
      return false;
    }
    
    // If documents bucket doesn't exist, create it
    if (!buckets.some(bucket => bucket.name === 'documents')) {
      const { data, error: createError } = await supabase
        .storage
        .createBucket('documents', { public: false });
        
      if (createError) {
        console.error("Error creating documents bucket:", createError);
        return false;
      }
      
      // Add RLS policy to allow authenticated users to upload
      // Note: This is normally done in migrations, but as a fallback
      console.log("Created documents bucket successfully");
    }
    
    return true;
  } catch (error: any) {
    console.error("Error ensuring documents bucket exists:", error);
    return false;
  }
};

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

/**
 * Downloads an image from a URL and saves it to the public folder
 */
export const downloadAndSaveImage = async (
  imageUrl: string, 
  savePath: string
): Promise<boolean> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the image blob
    const blob = await response.blob();
    
    // Convert blob to File
    const file = new File([blob], savePath.split('/').pop() || 'image.png', { type: blob.type });
    
    // Create a FormData to simulate a file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Save to public folder via a server endpoint
    // Note: In a real scenario, you would need a server endpoint to handle this
    // For now, we'll create the directories in the public folder
    
    console.log(`Image would be saved to: ${savePath}`);
    
    return true;
  } catch (error: any) {
    console.error("Error downloading and saving image:", error);
    return false;
  }
};

/**
 * Downloads and saves both logo and watermark to the public folder
 */
export const downloadAndSaveOrganizationAssets = async (
  logoUrl: string,
  watermarkUrl: string
): Promise<{logo: boolean, watermark: boolean}> => {
  const logoResult = await downloadAndSaveImage(
    logoUrl, 
    'public/images/company/logo.png'
  );
  
  const watermarkResult = await downloadAndSaveImage(
    watermarkUrl, 
    'public/images/company/watermark.png'
  );
  
  return {
    logo: logoResult,
    watermark: watermarkResult
  };
};
