
import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Organization, BrandingSettings } from "@/types/organization";

const formSchema = z.object({
  branding: z.object({
    primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
    text_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
  }),
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
  
  // Initialize branding if it doesn't exist
  const defaultBranding: BrandingSettings = {
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    text_color: "#111827"
  };
  
  // Get existing branding or use defaults
  const existingBranding = organization.branding || defaultBranding;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branding: existingBranding as BrandingSettings
    }
  });
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const updatedData: Partial<Organization> = { ...data };
      
      // Upload logo if a new file was selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;
        
        // Check if storage bucket exists
        try {
          // Try to upload
          const { error: uploadError } = await supabase.storage
            .from("assets")
            .upload(filePath, logoFile);
            
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from("assets")
            .getPublicUrl(filePath);
            
          updatedData.logo_url = urlData.publicUrl;
        } catch (error: any) {
          console.error("Error uploading logo:", error);
          throw new Error("Failed to upload logo. Make sure storage is configured correctly.");
        }
      }
      
      const success = await onUpdate(updatedData);
      
      if (success) {
        // Reset the file input
        setLogoFile(null);
      }
    } catch (error: any) {
      console.error("Error updating branding:", error);
      throw error;
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
          <p className="text-xs text-muted-foreground mt-1">
            Note: Logo upload requires storage bucket configuration
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
                  value={field.value || defaultBranding.primary_color}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                    value={field.value || defaultBranding.primary_color}
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
                  value={field.value || defaultBranding.secondary_color}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                    value={field.value || defaultBranding.secondary_color}
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
                  value={field.value || defaultBranding.text_color}
                  onChange={field.onChange}
                  className="h-9 w-9 p-0 border-0"
                />
                <FormControl>
                  <Input 
                    className="ml-2" 
                    {...field} 
                    value={field.value || defaultBranding.text_color}
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
            style={{ backgroundColor: form.watch("branding.primary_color") || defaultBranding.primary_color }}
          >
            <div 
              className="p-4 rounded"
              style={{ backgroundColor: form.watch("branding.secondary_color") || defaultBranding.secondary_color }}
            >
              <p 
                className="text-center font-medium"
                style={{ color: form.watch("branding.text_color") || defaultBranding.text_color }}
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
