
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
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      let updatedData: Partial<Organization> = { 
        branding: data.branding 
      };
      
      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          // First check if the bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const assetsBucket = buckets?.find(b => b.name === "assets");
          
          if (!assetsBucket) {
            // If the bucket doesn't exist, show an error
            toast({
              title: "Storage not configured",
              description: "The assets storage bucket is not configured. Logo upload is unavailable.",
              variant: "destructive",
            });
          } else {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from("assets")
              .upload(filePath, logoFile);
              
            if (uploadError) throw uploadError;
            
            const { data: urlData } = supabase.storage
              .from("assets")
              .getPublicUrl(filePath);
              
            updatedData.logo_url = urlData.publicUrl;
          }
        } catch (error: any) {
          console.error("Logo upload error:", error);
          toast({
            title: "Logo upload failed",
            description: error.message || "Failed to upload logo",
            variant: "destructive",
          });
          // Continue with saving other branding changes even if logo upload fails
        }
      }
      
      const success = await onUpdate(updatedData);
      
      if (success) {
        // Reset the file input
        setLogoFile(null);
      }
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
