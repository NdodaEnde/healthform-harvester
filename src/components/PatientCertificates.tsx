
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cleanCertificateData } from '@/utils/certificate-data-cleaner';
import { patientDataService } from '@/services/patientDataService';
import type { DatabasePatient, DatabaseDocument, DatabaseOrganization } from '@/types/database';
import PatientHeader from '@/components/patients/PatientHeader';
import OrganizationHeader from '@/components/organizations/OrganizationHeader';
import DocumentItem from '@/components/documents/DocumentItem';

interface PatientCertificatesProps {
  patientId: string;
  organizationId: string;
  clientOrganizationId?: string;
}

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ 
  patientId, 
  organizationId, 
  clientOrganizationId 
}) => {
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [patient, setPatient] = useState<DatabasePatient | null>(null);
  const [organization, setOrganization] = useState<DatabaseOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data
      try {
        const patientData = await patientDataService.fetchPatient(patientId);
        setPatient(patientData);
      } catch (error) {
        console.error('Error fetching patient:', error);
        toast.error('Failed to load patient information');
      }

      // Fetch organization data
      try {
        const orgData = await patientDataService.fetchOrganization(organizationId);
        setOrganization(orgData);
      } catch (error) {
        console.error('Error fetching organization:', error);
      }

      // Fetch patient-specific documents/certificates
      try {
        console.log('Fetching certificates for patient:', patientId, 'organization:', organizationId, 'client org:', clientOrganizationId);
        
        // Build query to check for documents in either organization_id or client_organization_id
        let query = supabase
          .from('documents')
          .select('*')
          .eq('owner_id', patientId)
          .eq('status', 'processed')
          .in('document_type', ['certificate-fitness', 'certificate', 'medical-certificate', 'fitness-certificate']);

        // Add organization filter - check both organization_id and client_organization_id
        if (clientOrganizationId) {
          query = query.or(`organization_id.eq.${organizationId},client_organization_id.eq.${clientOrganizationId}`);
        } else {
          query = query.eq('organization_id', organizationId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching patient certificates:', error);
          throw error;
        }

        console.log('Patient certificates found:', data?.length || 0);
        console.log('Certificates data:', data);
        
        const cleanedDocuments = (data || []).map(doc => ({
          ...doc,
          extracted_data: doc.extracted_data ? cleanCertificateData(doc.extracted_data) : null
        }));
        
        setDocuments(cleanedDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load certificates');
      }

    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId && organizationId) {
      fetchData();
    }
  }, [patientId, organizationId, clientOrganizationId]);

  const handleDownload = async (doc: DatabaseDocument) => {
    try {
      if (!doc.file_path) {
        toast.error('File path not available');
        return;
      }

      const { data, error } = await supabase.storage
        .from('medical-documents')
        .download(doc.file_path);

      if (error) {
        console.error('Download error:', error);
        toast.error('Failed to download document');
        return;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleView = (doc: DatabaseDocument) => {
    window.open(`/documents/${doc.id}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {patient && <PatientHeader patient={patient} />}
      {organization && <OrganizationHeader organization={organization} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Certificates
          </CardTitle>
          <CardDescription>
            Fitness certificates and medical documentation for {patient?.first_name} {patient?.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                No medical certificates have been uploaded for this patient yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onView={handleView}
                  onDownload={handleDownload}
                  showCertificateInfo={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientCertificates;
