
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface CertificateTemplate {
  id: string;
  name: string;
  organization_id: string;
  template_data: any;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchCertificateTemplates(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as CertificateTemplate[];
  } catch (error: any) {
    console.error("Error fetching certificate templates:", error);
    toast({
      title: "Error",
      description: "Failed to load certificate templates",
      variant: "destructive",
    });
    return [];
  }
}

export async function fetchCertificateTemplate(templateId: string) {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (error) throw error;
    return data as CertificateTemplate;
  } catch (error: any) {
    console.error("Error fetching certificate template:", error);
    toast({
      title: "Error",
      description: "Failed to load certificate template",
      variant: "destructive",
    });
    return null;
  }
}

export async function createCertificateTemplate(template: Omit<CertificateTemplate, "id" | "created_at" | "updated_at">) {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    toast({
      title: "Success",
      description: "Certificate template created successfully",
    });
    return data as CertificateTemplate;
  } catch (error: any) {
    console.error("Error creating certificate template:", error);
    toast({
      title: "Error",
      description: "Failed to create certificate template",
      variant: "destructive",
    });
    return null;
  }
}

export async function updateCertificateTemplate(id: string, updates: Partial<Omit<CertificateTemplate, "id" | "created_at" | "updated_at">>) {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    toast({
      title: "Success",
      description: "Certificate template updated successfully",
    });
    return data as CertificateTemplate;
  } catch (error: any) {
    console.error("Error updating certificate template:", error);
    toast({
      title: "Error",
      description: "Failed to update certificate template",
      variant: "destructive",
    });
    return null;
  }
}

export async function deleteCertificateTemplate(id: string) {
  try {
    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
    toast({
      title: "Success",
      description: "Certificate template deleted successfully",
    });
    return true;
  } catch (error: any) {
    console.error("Error deleting certificate template:", error);
    toast({
      title: "Error",
      description: "Failed to delete certificate template",
      variant: "destructive",
    });
    return false;
  }
}

export async function setDefaultTemplate(templateId: string, organizationId: string) {
  try {
    // First, unset all defaults
    await supabase
      .from("certificate_templates")
      .update({ is_default: false })
      .eq("organization_id", organizationId);

    // Then set this one as default
    const { error } = await supabase
      .from("certificate_templates")
      .update({ is_default: true })
      .eq("id", templateId);

    if (error) throw error;
    toast({
      title: "Success",
      description: "Default template updated successfully",
    });
    return true;
  } catch (error: any) {
    console.error("Error setting default template:", error);
    toast({
      title: "Error",
      description: "Failed to set default template",
      variant: "destructive",
    });
    return false;
  }
}
