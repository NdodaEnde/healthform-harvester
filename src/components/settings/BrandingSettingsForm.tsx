
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Organization, BrandingSettings } from "@/types/organization";
import { toast } from "@/components/ui/use-toast";

// Color validation regex
const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;

const formSchema = z.object({
  branding: z.object({
    primary_color: z.string().regex(colorRegex, { message: "Must be a valid hex color code" }),
    secondary_color: z.string().regex(colorRegex, { message: "Must be a valid hex color code" }),
    text_color: z.string().regex(colorRegex, { message: "Must be a valid hex color code" })
  })
});

type FormValues = z.infer<typeof formSchema>;

interface BrandingSettingsFormProps {
  organization: Organization;
  onUpdate: (data: Partial<Organization>) => Promise<boolean>;
}

export default function BrandingSettingsForm({ organization, onUpdate }: BrandingSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logo_url || null);
  const [logoError, setLogoError] = useState<string | null>(null);
  
  // Initialize branding if it doesn't exist
  const defaultBranding: BrandingSettings = {
    primary_color: "#0f172a",
    secondary_color: "#6366f1",
    text_color: "#ffffff"
  };
  
  // Use existing branding or defaults
  const currentBranding = organization?.branding || defaultBranding;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branding: {
        primary_color: currentBranding.primary_color || defaultBranding.primary_color,
        secondary_color: currentBranding.secondary_color || defaultBranding.secondary_color,
        text_color: currentBranding.text_color || defaultBranding.text_color
      }
    }
  });
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setLogoError("Logo file size must be less than 2MB");
        return;
      }
      
      // Reset any previous errors
      setLogoError(null);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setLogoError(null);
    
    try {
      // Instead of directly updating the branding field, we'll update the settings
      // field which includes branding information
      let updatedData: Partial<Organization> = {};
      
      // Get current settings or initialize empty object
      const currentSettings = typeof organization.settings === 'object' ? organization.settings : {};
      
      // Update settings with branding info
      updatedData.settings = {
        ...(currentSettings as Record<string, unknown>),
        branding: data.branding
      };
      
      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          // Skip the bucket check since we know it exists now
          // Just proceed with the upload
          
          // Prepare for file upload
          const fileExt = logoFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `logos/${fileName}`;
          
          // Delete previous logo if exists
          if (organization.logo_url) {
            try {
              const previousPath = organization.logo_url.split('/').slice(-2).join('/'); // Extract "logos/filename.ext"
              await supabase.storage.from("assets").remove([previousPath]);
            } catch (removeError) {
              console.error("Failed to remove previous logo:", removeError);
              // Continue even if removal fails
            }
          }
          
          // Upload new logo
          const { error: uploadError } = await supabase.storage
            .from("assets")
            .upload(filePath, logoFile, {
              cacheControl: '3600',
              upsert: true // Changed to true to avoid conflicts
            });
            
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from("assets")
            .getPublicUrl(filePath);
            
          updatedData.logo_url = urlData.publicUrl;
        } catch (error: any) {
          console.error("Logo upload error:", error);
          setLogoError(error.message || "Failed to upload logo");
          // Continue with saving other branding changes even if logo upload fails
        }
      }
      
      const success = await onUpdate(updatedData);
      
      if (success) {
        toast({
          title: "Branding updated",
          description: "Your organization branding has been saved successfully",
        });
        // Reset the file input
        setLogoFile(null);
      }
    } catch (error: any) {
      console.error("Error saving branding:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update branding",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <FormLabel>Organization Logo</FormLabel>
          <div className="flex items-center mt-2">
            {logoPreview && (
              <div className="mr-4">
                <img 
                  src={logoPreview} 
                  alt="Logo" 
                  className="h-16 w-16 object-contain rounded"
                />
              </div>
            )}
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoChange} 
            />
          </div>
          {logoError && (
            <p className="text-sm text-destructive mt-1">{logoError}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Recommended size: 512x512px. Max file size: 2MB.
          </p>
        </div>
        
        <FormField
          control={form.control}
          name="branding.primary_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Color</FormLabel>
              <div className="flex items-center">
                <input
                  type="color"
                  value={field.value}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                  />
                </FormControl>
              </div>
              <FormMessage />
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
                  value={field.value}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                  />
                </FormControl>
              </div>
              <FormMessage />
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
                  value={field.value}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="mt-6 p-4 border rounded-md">
          <h3 className="text-sm font-medium mb-2">Preview</h3>
          <div 
            className="p-4 rounded"
            style={{ backgroundColor: form.watch("branding.primary_color") }}
          >
            <div 
              className="p-4 rounded"
              style={{ backgroundColor: form.watch("branding.secondary_color") }}
            >
              <p 
                className="text-center font-medium"
                style={{ color: form.watch("branding.text_color") }}
              >
                {organization?.name || "Organization Name"}
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
              Saving...
            </span>
          ) : (
            "Save Branding"
          )}
        </Button>
      </form>
    </Form>
  );
}
