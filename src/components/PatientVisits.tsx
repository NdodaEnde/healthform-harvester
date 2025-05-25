
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Plus, User, Building2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { toast } from 'sonner';

interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  visit_type: string;
  notes: string;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
  status: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface PatientVisitsProps {
  patientId: string;
  organizationId: string;
}

const PatientVisits: React.FC<PatientVisitsProps> = ({ patientId, organizationId }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const safeFormatDate = (dateString: string | null): string => {
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

      // Fetch patient info with proper error handling
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('id', patientId)
        .maybeSingle();

      if (patientError) {
        console.error('Error fetching patient:', patientError);
        toast.error('Failed to load patient information');
        return;
      }

      if (patientData) {
        setPatient({
          id: patientData.id,
          first_name: patientData.first_name || '',
          last_name: patientData.last_name || ''
        });
      }

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, file_name, document_type, created_at, status')
        .eq('owner_id', patientId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        toast.error('Failed to load documents');
      } else if (documentsData && Array.isArray(documentsData)) {
        const typedDocuments: Document[] = documentsData
          .filter((item: any) => item !== null && typeof item === 'object')
          .map((item: any) => ({
            id: item.id || '',
            file_name: item.file_name || 'Unknown',
            document_type: item.document_type || 'unknown',
            created_at: item.created_at || '',
            status: item.status || 'unknown'
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
  }, [patientId, organizationId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default">Processed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    switch (type) {
      case 'certificate-fitness':
        return <Badge variant="default">Fitness Certificate</Badge>;
      case 'medical-certificate':
        return <Badge variant="default">Medical Certificate</Badge>;
      case 'certificate':
        return <Badge variant="default">Certificate</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading patient visits...</div>
      </div>
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
              Patient visits and document history
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document History
          </CardTitle>
          <CardDescription>
            All documents uploaded for this patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents</h3>
              <p className="text-muted-foreground">
                No documents have been uploaded for this patient yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.file_name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        {getDocumentTypeBadge(doc.document_type)}
                        {getStatusBadge(doc.status)}
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {safeFormatDate(doc.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visit History
          </CardTitle>
          <CardDescription>
            Medical visits and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Visits Recorded</h3>
              <p className="text-muted-foreground mb-4">
                No medical visits have been recorded for this patient yet.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Visit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{visit.visit_type}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{visit.notes}</p>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {safeFormatDate(visit.visit_date)}
                      </span>
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

export default PatientVisits;
