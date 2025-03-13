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
  address?: any;
  settings?: any;
  updated_at?: string;
  created_at?: string;
  is_active?: boolean;
}
