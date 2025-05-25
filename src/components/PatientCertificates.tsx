
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, Building2, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type: string;
  processed_at: string | null;
  created_at: string;
  extracted_data?: any;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  id_number?: string;
}

interface Organization {
  id: string;
  name: string;
}

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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const safeFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data with proper error handling
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name, id_number')
        .eq('id', patientId)
        .maybeSingle();

      if (patientError) {
        console.error('Error fetching patient:', patientError);
        toast.error('Failed to load patient information');
        return;
      }

      if (patientData && typeof patientData === 'object') {
        setPatient({
          id: patientData.id || '',
          first_name: patientData.first_name || '',
          last_name: patientData.last_name || '',
          id_number: patientData.id_number || undefined,
        });
      }

      // Fetch organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      } else if (orgData && typeof orgData === 'object') {
        setOrganization({
          id: orgData.id || '',
          name: orgData.name || ''
        });
      }

      // Fetch documents with proper typing - using exact string values for the filter
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, file_name, file_path, status, document_type, processed_at, created_at, extracted_data')
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .in('document_type', ['certificate-fitness', 'certificate', 'medical-certificate', 'fitness-certificate'])
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        toast.error('Failed to load certificates');
        return;
      }

      if (documentsData && Array.isArray(documentsData)) {
        const typedDocuments: Document[] = documentsData
          .filter((item: any) => item && typeof item === 'object')
          .map((item: any) => ({
            id: item.id || '',
            file_name: item.file_name || 'Unknown',
            file_path: item.file_path || '',
            status: item.status || 'unknown',
            document_type: item.document_type || 'unknown',
            processed_at: item.processed_at || null,
            created_at: item.created_at || '',
            extracted_data: item.extracted_data || null
          }));
        
        setDocuments(typedDocuments);
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

  const handleDownload = async (doc: Document) => {
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

  const handleView = (doc: Document) => {
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
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {patient.first_name} {patient.last_name}
            </CardTitle>
            <CardDescription>
              {patient.id_number && `ID: ${patient.id_number} • `}
              Patient ID: {patient.id}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {organization.name}
            </CardTitle>
            <CardDescription>
              Organization: {organization.id}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Certificates
          </CardTitle>
          <CardDescription>
            Fitness certificates and medical documentation
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
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.file_name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{doc.document_type}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {safeFormatDate(doc.created_at)}
                        </span>
                        {doc.processed_at && (
                          <span>Processed: {safeFormatDate(doc.processed_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientCertificates;
