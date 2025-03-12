
import { Json } from "@/integrations/supabase/types";

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: Json;
  industry?: string;
  settings?: Json;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  userRole?: string;
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    text_color?: string;
  };
}

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentClient: Organization | null;
  userOrganizations: Organization[];
  clientOrganizations: Organization[];
  loading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  switchClient: (clientId: string | null) => void;
  isServiceProvider: () => boolean;
  getEffectiveOrganizationId: () => string | null;
}

export interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  text_color: string;
}

export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface OrganizationFormValues {
  name: string;
  contact_email: string;
  contact_phone: string;
  industry: string;
  address: AddressData;
  branding: BrandingSettings;
}

// Function to safely extract branding information from organization settings
export function getOrganizationBranding(organization: Organization | null): BrandingSettings {
  // Default branding values
  const defaultBranding: BrandingSettings = {
    primary_color: "#0f172a",
    secondary_color: "#6366f1",
    text_color: "#ffffff"
  };

  if (!organization) return defaultBranding;

  // Try to get branding from the organization object
  if (organization.branding) {
    return {
      primary_color: organization.branding.primary_color || defaultBranding.primary_color,
      secondary_color: organization.branding.secondary_color || defaultBranding.secondary_color,
      text_color: organization.branding.text_color || defaultBranding.text_color
    };
  }

  // Try to get branding from settings
  if (organization.settings && typeof organization.settings === 'object') {
    const settings = organization.settings as Record<string, any>;
    
    if (settings.branding) {
      return {
        primary_color: settings.branding.primary_color || defaultBranding.primary_color,
        secondary_color: settings.branding.secondary_color || defaultBranding.secondary_color,
        text_color: settings.branding.text_color || defaultBranding.text_color
      };
    }
  }

  return defaultBranding;
}
