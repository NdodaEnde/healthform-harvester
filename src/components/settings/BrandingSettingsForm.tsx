
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Organization, BrandingSettings, getOrganizationBranding } from "@/types/organization";
import BrandingAssetsForm from "./BrandingAssetsForm";

interface BrandingSettingsFormProps {
  organization: Organization;
  onUpdate: (updatedData: Partial<Organization>) => Promise<boolean>;
}

export default function BrandingSettingsForm({ organization, onUpdate }: BrandingSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get branding using the helper function
  const branding = getOrganizationBranding(organization);
  
  const form = useForm<{ branding: BrandingSettings }>({
    defaultValues: {
      branding: branding
    }
  });
  
  const handleBrandingColorsSubmit = async (data: { branding: BrandingSettings }) => {
    setIsSubmitting(true);
    
    try {
      // Prepare settings object with branding
      const existingSettings = typeof organization.settings === 'object' ? 
        organization.settings as Record<string, any> : {};
        
      const updatedData = {
        settings: {
          ...existingSettings,
          branding: data.branding
        }
      };
      
      const success = await onUpdate(updatedData);
      
      if (success) {
        toast({
          title: "Branding Updated",
          description: "Your organization's branding colors have been updated.",
        });
      }
    } catch (error: any) {
      console.error("Error updating branding:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update branding settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssetsUpdate = (updated: boolean) => {
    if (updated) {
      // Refresh organization data by calling onUpdate with empty object
      // This will trigger a refresh in the parent component
      onUpdate({});
    }
  };
  
  return (
    <Tabs defaultValue="colors">
      <TabsList className="mb-6">
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="assets">Logo & Assets</TabsTrigger>
      </TabsList>
      
      <TabsContent value="colors">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBrandingColorsSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="branding.primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color</FormLabel>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={field.value || "#3B82F6"}
                      onChange={field.onChange}
                      className="h-9 w-9 p-0 border-0"
                    />
                    <FormControl>
                      <Input 
                        className="ml-2" 
                        {...field} 
                        value={field.value || "#3B82F6"}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Used for main branding elements and primary buttons
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="branding.secondary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Color</FormLabel>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={field.value || "#1E40AF"}
                      onChange={field.onChange}
                      className="h-9 w-9 p-0 border-0"
                    />
                    <FormControl>
                      <Input 
                        className="ml-2" 
                        {...field} 
                        value={field.value || "#1E40AF"}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Used for accents and secondary elements
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="branding.text_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Color</FormLabel>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={field.value || "#111827"}
                      onChange={field.onChange}
                      className="h-9 w-9 p-0 border-0"
                    />
                    <FormControl>
                      <Input 
                        className="ml-2" 
                        {...field} 
                        value={field.value || "#111827"}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Used for text on your branded elements
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="mt-6 p-4 border rounded-md">
              <h3 className="text-sm font-medium mb-2">Preview</h3>
              <div 
                className="p-4 rounded"
                style={{ backgroundColor: form.watch("branding.primary_color") || "#3B82F6" }}
              >
                <div 
                  className="p-4 rounded"
                  style={{ backgroundColor: form.watch("branding.secondary_color") || "#1E40AF" }}
                >
                  <p 
                    className="text-center font-medium"
                    style={{ color: form.watch("branding.text_color") || "#111827" }}
                  >
                    {organization?.name || "Organization Name"}
                  </p>
                </div>
              </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
                  Saving...
                </span>
              ) : (
                "Save Branding Colors"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="assets">
        <BrandingAssetsForm 
          organization={organization}
          onUpdate={handleAssetsUpdate}
        />
      </TabsContent>
    </Tabs>
  );
}
