
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import { patientDataService } from '@/services/patientDataService';
import type { DatabasePatient, DatabaseDocument } from '@/types/database';
import PatientHeader from '@/components/patients/PatientHeader';
import DocumentItem from '@/components/documents/DocumentItem';

interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  visit_type: string;
  notes: string;
  created_at: string;
}

interface PatientVisitsProps {
  patientId: string;
  organizationId: string;
}

const PatientVisits: React.FC<PatientVisitsProps> = ({ patientId, organizationId }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [patient, setPatient] = useState<DatabasePatient | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch patient info
      try {
        const patientData = await patientDataService.fetchPatient(patientId);
        setPatient(patientData);
      } catch (error) {
        console.error('Error fetching patient:', error);
        toast.error('Failed to load patient information');
      }

      // Fetch documents
      try {
        const documentsData = await patientDataService.fetchPatientDocuments(patientId, organizationId);
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
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

  const handleView = (doc: DatabaseDocument) => {
    window.open(`/documents/${doc.id}`, '_blank');
  };

  const handleDownload = () => {
    // Download functionality would be implemented here
    toast.info('Download functionality not implemented yet');
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
      {patient && <PatientHeader patient={patient} />}

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
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onView={handleView}
                  onDownload={handleDownload}
                />
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
                        {visit.visit_date}
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
