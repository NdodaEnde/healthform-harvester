
import { Json } from "@/integrations/supabase/types";

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  industry?: string;
  address?: Json;
  settings?: Json;
  updated_at?: string;
  created_at?: string;
  is_active?: boolean;
  userRole?: string;
  branding?: Record<string, string>;
}

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  currentClient: Organization | null;
  userOrganizations: Organization[];
  clientOrganizations: Organization[];
  loading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  switchClient: (clientId: string) => void;
  isServiceProvider: () => boolean;
  getEffectiveOrganizationId: () => string | null;
}

// Modified to have string indexing for compatibility with Record<string, string>
export interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  text_color: string;
  [key: string]: string; // Add index signature to make it assignable to Record<string, string>
}

export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
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

  // Try to get branding from the organization object directly
  if (organization.branding) {
    const typedBranding = organization.branding as Record<string, string>;
    return {
      primary_color: typedBranding.primary_color || defaultBranding.primary_color,
      secondary_color: typedBranding.secondary_color || defaultBranding.secondary_color,
      text_color: typedBranding.text_color || defaultBranding.text_color
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
