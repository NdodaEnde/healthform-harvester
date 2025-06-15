
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cleanCertificateData } from '@/utils/certificate-data-cleaner';
import type { DatabasePatient, DatabaseDocument, DatabaseOrganization } from '@/types/database';
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
  const [clientOrganization, setClientOrganization] = useState<DatabaseOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data first
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (patientError) {
          console.error('Error fetching patient:', patientError);
          toast.error('Failed to load patient information');
          return;
        } else {
          setPatient(patientData);
          console.log('Patient data loaded:', patientData);
        }

        // Fetch client organization data if available
        if (clientOrganizationId) {
          try {
            const { data: clientOrgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', clientOrganizationId)
              .single();

            if (orgError) {
              console.error('Error fetching client organization:', orgError);
            } else {
              setClientOrganization(clientOrgData);
              console.log('Client organization data loaded:', clientOrgData);
            }
          } catch (error) {
            console.error('Error fetching client organization:', error);
          }
        }

        // Now fetch documents using multiple strategies
        console.log('=== COMPREHENSIVE DOCUMENT SEARCH ===');
        console.log('Patient ID:', patientId);
        console.log('Patient ID Number:', patientData.id_number);
        console.log('Organization ID:', organizationId);
        console.log('Client Organization ID:', clientOrganizationId);
        
        const allDocuments: DatabaseDocument[] = [];

        // Strategy 1: Documents directly linked to patient (owner_id)
        console.log('Strategy 1: Looking for documents with owner_id =', patientId);
        const { data: linkedDocs, error: linkedError } = await supabase
          .from('documents')
          .select('*')
          .eq('owner_id', patientId)
          .order('created_at', { ascending: false });

        if (linkedError) {
          console.error('Error fetching linked documents:', linkedError);
        } else {
          console.log('Found linked documents:', linkedDocs?.length || 0);
          if (linkedDocs) allDocuments.push(...linkedDocs);
        }

        // Strategy 2: Documents with client_organization_id match (even if not linked to patient)
        if (clientOrganizationId) {
          console.log('Strategy 2: Looking for documents with client_organization_id =', clientOrganizationId);
          const { data: clientDocs, error: clientError } = await supabase
            .from('documents')
            .select('*')
            .eq('client_organization_id', clientOrganizationId)
            .in('status', ['processed', 'completed'])
            .order('created_at', { ascending: false });

          if (clientError) {
            console.error('Error fetching client documents:', clientError);
          } else {
            console.log('Found client organization documents:', clientDocs?.length || 0);
            if (clientDocs) {
              // Filter for documents that might belong to this patient by ID number
              const patientIdNumber = patientData.id_number;
              if (patientIdNumber) {
                const matchingDocs = clientDocs.filter(doc => {
                  if (!doc.extracted_data) return false;
                  
                  const extractedDataStr = JSON.stringify(doc.extracted_data).toLowerCase();
                  return extractedDataStr.includes(patientIdNumber);
                });
                
                console.log('Documents matching patient ID number:', matchingDocs.length);
                allDocuments.push(...matchingDocs);
              }
            }
          }
        }

        // Strategy 3: All processed documents from organization
        console.log('Strategy 3: Looking for all processed documents from organization:', organizationId);
        const { data: orgDocs, error: orgError } = await supabase
          .from('documents')
          .select('*')
          .eq('organization_id', organizationId)
          .in('status', ['processed', 'completed'])
          .order('created_at', { ascending: false });

        if (orgError) {
          console.error('Error fetching organization documents:', orgError);
        } else {
          console.log('Found organization documents:', orgDocs?.length || 0);
          if (orgDocs && patientData.id_number) {
            // Filter for documents that might belong to this patient by ID number
            const matchingDocs = orgDocs.filter(doc => {
              if (!doc.extracted_data) return false;
              
              const extractedDataStr = JSON.stringify(doc.extracted_data).toLowerCase();
              return extractedDataStr.includes(patientData.id_number);
            });
            
            console.log('Org documents matching patient ID number:', matchingDocs.length);
            allDocuments.push(...matchingDocs);
          }
        }

        // Remove duplicates based on document ID
        const uniqueDocuments = allDocuments.filter((doc, index, self) => 
          index === self.findIndex(d => d.id === doc.id)
        );

        console.log('Total unique documents found:', uniqueDocuments.length);
        
        // Filter for certificate-type documents and clean data
        const certificateTypes = ['certificate-fitness', 'certificate', 'medical-certificate', 'fitness-certificate'];
        const certificateDocuments = uniqueDocuments.filter(doc => {
          const isCertificateType = certificateTypes.includes(doc.document_type || '');
          const isProcessed = (doc.status === 'completed' || doc.status === 'processed');
          return isCertificateType || isProcessed;
        });
        
        console.log('Certificate documents found:', certificateDocuments.length);
        
        const cleanedDocuments = certificateDocuments.map(doc => ({
          ...doc,
          extracted_data: doc.extracted_data ? cleanCertificateData(doc.extracted_data) : null
        }));
        
        setDocuments(cleanedDocuments);

      } catch (error) {
        console.error('Error in patient data fetch:', error);
        toast.error('Failed to load patient data');
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Certificates
          </CardTitle>
          <CardDescription>
            Medical certificates and fitness documentation for {patient?.first_name} {patient?.last_name}
            {clientOrganization && ` from ${clientOrganization.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                No medical certificates have been found for this patient.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Patient: {patient?.first_name} {patient?.last_name} (ID: {patient?.id_number})
              </p>
              <p className="text-xs text-muted-foreground">
                Searched in: {clientOrganization?.name || 'Unknown Organization'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Found {documents.length} certificate{documents.length !== 1 ? 's' : ''}
              </div>
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
