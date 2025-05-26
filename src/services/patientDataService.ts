
import { supabase } from '@/integrations/supabase/client';
import type { DatabasePatient, DatabaseDocument, DatabaseOrganization } from '@/types/database';

export const patientDataService = {
  async fetchPatient(patientId: string): Promise<DatabasePatient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching patient:', error);
        throw error;
      }

      return data as DatabasePatient | null;
    } catch (error) {
      console.error('Patient fetch failed:', error);
      throw error;
    }
  },

  async fetchOrganization(organizationId: string): Promise<DatabaseOrganization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organization:', error);
        throw error;
      }

      return data as DatabaseOrganization | null;
    } catch (error) {
      console.error('Organization fetch failed:', error);
      throw error;
    }
  },

  async fetchPatientCertificates(organizationId: string): Promise<DatabaseDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .in('document_type', ['certificate-fitness', 'certificate', 'medical-certificate', 'fitness-certificate'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }

      return (data || []) as DatabaseDocument[];
    } catch (error) {
      console.error('Certificates fetch failed:', error);
      throw error;
    }
  },

  async fetchPatientDocuments(patientId: string, organizationId: string): Promise<DatabaseDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', patientId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient documents:', error);
        throw error;
      }

      return (data || []) as DatabaseDocument[];
    } catch (error) {
      console.error('Patient documents fetch failed:', error);
      throw error;
    }
  },

  async fetchPatientsList(organizationId: string, clientOrganizationId?: string): Promise<DatabasePatient[]> {
    try {
      let query = supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId);

      if (clientOrganizationId) {
        query = query.eq('client_organization_id', clientOrganizationId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patients list:', error);
        throw error;
      }

      return (data || []) as DatabasePatient[];
    } catch (error) {
      console.error('Patients list fetch failed:', error);
      throw error;
    }
  }
};
