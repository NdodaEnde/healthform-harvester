
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Organization } from "@/types/organization";
import { uploadOrganizationAsset, deleteOrganizationAsset, updateOrganizationAssets } from "@/utils/organization-assets";
import OrganizationLogo from "@/components/OrganizationLogo";

interface BrandingAssetsFormProps {
  organization: Organization;
  onUpdate: (updated: boolean) => void;
}

const BrandingAssetsForm = ({ organization, onUpdate }: BrandingAssetsFormProps) => {
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({
    logo: false,
    signature: false,
    stamp: false
  });
  
  const handleAssetUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    assetType: 'logo' | 'signature' | 'stamp'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !organization?.id) return;
    
    setIsUploading(prev => ({ ...prev, [assetType]: true }));
    
    try {
      // Upload the file to storage
      const assetUrl = await uploadOrganizationAsset(file, organization.id, assetType);
      
      if (!assetUrl) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Update the organization record with the new URL
      const updates: { [key: string]: string } = {};
      
      if (assetType === 'logo') {
        updates.logo_url = assetUrl;
      } else if (assetType === 'signature') {
        updates.signature_url = assetUrl;
      } else if (assetType === 'stamp') {
        updates.stamp_url = assetUrl;
      }
      
      const success = await updateOrganizationAssets(organization.id, updates);
      
      if (success) {
        toast({
          title: "Upload Successful",
          description: `Organization ${assetType} updated successfully.`
        });
        onUpdate(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to update ${assetType}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [assetType]: false }));
    }
  };
  
  const handleDeleteAsset = async (assetType: 'logo' | 'signature' | 'stamp') => {
    if (!organization?.id) return;
    
    // Determine which URL to delete
    let assetUrl = "";
    if (assetType === 'logo') {
      assetUrl = organization.logo_url || "";
    } else if (assetType === 'signature') {
      assetUrl = organization.signature_url || "";
    } else if (assetType === 'stamp') {
      assetUrl = organization.stamp_url || "";
    }
    
    if (!assetUrl) {
      toast({
        title: "No Asset Found",
        description: `No ${assetType} found to delete.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete this ${assetType}?`)) return;
    
    setIsUploading(prev => ({ ...prev, [assetType]: true }));
    
    try {
      // Delete the file from storage
      const deleted = await deleteOrganizationAsset(assetUrl, organization.id);
      
      if (!deleted) {
        toast({
          title: "Deletion Failed",
          description: `Failed to delete ${assetType}. Please try again.`,
          variant: "destructive"
        });
        return;
      }
      
      // Update the organization record to remove the URL
      const updates: { [key: string]: null } = {};
      
      if (assetType === 'logo') {
        updates.logo_url = null;
      } else if (assetType === 'signature') {
        updates.signature_url = null;
      } else if (assetType === 'stamp') {
        updates.stamp_url = null;
      }
      
      const success = await updateOrganizationAssets(organization.id, updates as any);
      
      if (success) {
        toast({
          title: "Deletion Successful",
          description: `Organization ${assetType} removed successfully.`
        });
        onUpdate(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to delete ${assetType}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [assetType]: false }));
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Logo</CardTitle>
          <CardDescription>
            Upload your organization's logo for documents and the application interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="p-6 border rounded-md flex justify-center items-center bg-gray-50 dark:bg-gray-900">
              <OrganizationLogo 
                organization={organization} 
                variant="logo" 
                size="lg" 
                className="max-h-32 max-w-48 object-contain"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Upload New Logo</Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'logo')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                />
              </div>
              <div className="flex justify-end">
                {organization.logo_url && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteAsset('logo')}
                    disabled={isUploading.logo}
                  >
                    {isUploading.logo ? "Deleting..." : "Delete Logo"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Organization Signature</CardTitle>
          <CardDescription>
            Upload your organization's signature for certificates and official documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="p-6 border rounded-md flex justify-center items-center bg-gray-50 dark:bg-gray-900 min-h-24 min-w-48">
              <OrganizationLogo 
                organization={organization} 
                variant="signature" 
                size="lg" 
                className="max-h-24 max-w-48 object-contain"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload">Upload Signature</Label>
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'signature')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: Clear signature on white or transparent background
                </p>
              </div>
              <div className="flex justify-end">
                {organization.signature_url && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteAsset('signature')}
                    disabled={isUploading.signature}
                  >
                    {isUploading.signature ? "Deleting..." : "Delete Signature"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Organization Stamp</CardTitle>
          <CardDescription>
            Upload your organization's official stamp for certificates and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="p-6 border rounded-md flex justify-center items-center bg-gray-50 dark:bg-gray-900 min-h-24 min-w-48">
              <OrganizationLogo 
                organization={organization} 
                variant="stamp" 
                size="lg" 
                className="max-h-24 max-w-48 object-contain"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stamp-upload">Upload Stamp</Label>
                <input
                  id="stamp-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAssetUpload(e, 'stamp')}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: Clear stamp image on transparent background
                </p>
              </div>
              <div className="flex justify-end">
                {organization.stamp_url && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteAsset('stamp')}
                    disabled={isUploading.stamp}
                  >
                    {isUploading.stamp ? "Deleting..." : "Delete Stamp"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingAssetsForm;
