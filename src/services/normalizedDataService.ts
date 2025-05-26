
import { supabase } from '@/integrations/supabase/client';
import type {
  MyOrganization,
  MyUser,
  MyPatient,
  MyDocument,
  MyOrganizationType,
  MyUserType,
  MyDocumentType,
  MyOrganizationRelationship,
  MyOrganizationWithType,
  MyUserWithDetails,
  MyPatientWithOrganization,
  MyDocumentWithDetails
} from '@/types/normalized-database';

export class NormalizedDataService {
  // Organization Types
  static async getOrganizationTypes(): Promise<MyOrganizationType[]> {
    const { data, error } = await supabase
      .from('my_organization_types')
      .select('*')
      .order('type_name');
    
    if (error) throw error;
    return data || [];
  }

  // User Types
  static async getUserTypes(): Promise<MyUserType[]> {
    const { data, error } = await supabase
      .from('my_user_types')
      .select('*')
      .order('type_name');
    
    if (error) throw error;
    return data || [];
  }

  // Document Types
  static async getDocumentTypes(): Promise<MyDocumentType[]> {
    const { data, error } = await supabase
      .from('my_document_types')
      .select('*')
      .order('type_name');
    
    if (error) throw error;
    return data || [];
  }

  // Organizations
  static async getOrganizations(): Promise<MyOrganizationWithType[]> {
    const { data, error } = await supabase
      .from('my_organizations')
      .select(`
        *,
        organization_type:my_organization_types(*)
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async createOrganization(
    organization: Omit<MyOrganization, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MyOrganization> {
    const { data, error } = await supabase
      .from('my_organizations')
      .insert(organization)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Users
  static async getUsersByOrganization(organizationId: string): Promise<MyUserWithDetails[]> {
    const { data, error } = await supabase
      .from('my_users')
      .select(`
        *,
        organization:my_organizations(*),
        user_type:my_user_types(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('full_name');
    
    if (error) throw error;
    return data || [];
  }

  static async createUser(
    user: Omit<MyUser, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MyUser> {
    const { data, error } = await supabase
      .from('my_users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Patients
  static async getPatientsByOrganization(clientOrganizationId: string): Promise<MyPatientWithOrganization[]> {
    const { data, error } = await supabase
      .from('my_patients')
      .select(`
        *,
        client_organization:my_organizations(*)
      `)
      .eq('client_organization_id', clientOrganizationId)
      .eq('is_active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async createPatient(
    patient: Omit<MyPatient, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MyPatient> {
    const { data, error } = await supabase
      .from('my_patients')
      .insert(patient)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Documents
  static async getDocumentsByPatient(patientId: string): Promise<MyDocumentWithDetails[]> {
    const { data, error } = await supabase
      .from('my_documents')
      .select(`
        *,
        patient:my_patients(*),
        document_type:my_document_types(*),
        uploader:my_users(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createDocument(
    document: Omit<MyDocument, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MyDocument> {
    const { data, error } = await supabase
      .from('my_documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Organization Relationships
  static async getServiceProviderClients(serviceProviderId: string): Promise<MyOrganizationRelationship[]> {
    const { data, error } = await supabase
      .from('my_organization_relationships')
      .select(`
        *,
        service_provider:service_provider_id(my_organizations(*)),
        client:client_id(my_organizations(*))
      `)
      .eq('service_provider_id', serviceProviderId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createOrganizationRelationship(
    relationship: Omit<MyOrganizationRelationship, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MyOrganizationRelationship> {
    const { data, error } = await supabase
      .from('my_organization_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Utility Methods
  static async getOrganizationsByType(typeName: string): Promise<MyOrganization[]> {
    const { data, error } = await supabase
      .from('my_organizations')
      .select(`
        *,
        organization_type:my_organization_types!inner(*)
      `)
      .eq('my_organization_types.type_name', typeName)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async searchPatients(searchTerm: string, organizationId?: string): Promise<MyPatient[]> {
    let query = supabase
      .from('my_patients')
      .select('*')
      .eq('is_active', true);

    if (organizationId) {
      query = query.eq('client_organization_id', organizationId);
    }

    if (searchTerm) {
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,id_number.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
}
