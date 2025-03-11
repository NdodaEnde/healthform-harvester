
export interface Organization {
  id: string;
  name: string;
  organization_type: string;
  logo_url?: string;
  contact_email?: string;
  userRole?: string;
  settings?: any;
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
