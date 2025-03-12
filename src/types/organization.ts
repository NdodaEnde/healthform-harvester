
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
