
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
