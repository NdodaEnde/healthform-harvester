
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { Organization, BrandingSettings, AddressData, getOrganizationBranding } from "@/types/organization";
import { Json } from "@/integrations/supabase/types";

interface OrganizationFormValues {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  address: AddressData;
  branding: BrandingSettings;
  logo_url?: string;
}

interface OrganizationSettingsFormProps {
  organization: Organization;
}

export default function OrganizationSettingsForm({ organization }: OrganizationSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logo_url || null);
  
  // Parse address from JSON if needed
  const address = organization?.address ? 
    (typeof organization.address === 'string' ? 
      JSON.parse(organization.address as string) : 
      organization.address as unknown as AddressData) : 
    {};
  
  // Get branding using the helper function
  const branding = getOrganizationBranding(organization);
  
  const form = useForm<OrganizationFormValues>({
    defaultValues: {
      name: organization?.name || "",
      contact_email: organization?.contact_email || "",
      contact_phone: organization?.contact_phone || "",
      industry: organization?.industry || "",
      address: address || {},
      branding: branding
    }
  });
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const onSubmit = async (data: OrganizationFormValues) => {
    setIsSubmitting(true);
    
    try {
      let updatedData: Partial<Organization> = { 
        ...data,
        address: data.address as unknown as Json
      };
      
      // Prepare settings object with branding
      const existingSettings = typeof organization.settings === 'object' ? 
        organization.settings as Record<string, any> : {};
        
      updatedData.settings = {
        ...existingSettings,
        branding: data.branding
      } as unknown as Json;
      
      // Upload logo if a new file was selected
      if (logoFile) {
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
      
      // Update organization in database
      const { error } = await supabase
        .from("organizations")
        .update(updatedData)
        .eq("id", organization.id);
        
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Organization settings have been updated",
      });
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="branding" className="space-y-4">
            <div className="mb-4">
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
                    {form.watch("name") || organization?.name || "Organization Name"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-r-transparent rounded-full"></div>
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
