
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientVisitsProps {
  patientId: string;
  organizationId: string;
}

// Group documents by date to represent visits
const groupDocumentsByDate = (documents: any[]) => {
  const visits = documents.reduce((acc: any, doc: any) => {
    // Use processed_at or created_at as visit date
    const visitDate = doc.processed_at || doc.created_at;
    const dateKey = visitDate.split('T')[0]; // Get just the date part

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        documents: []
      };
    }

    acc[dateKey].documents.push(doc);
    return acc;
  }, {});

  // Convert to array and sort by date (newest first)
  return Object.values(visits).sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

const PatientVisits: React.FC<PatientVisitsProps> = ({ patientId, organizationId }) => {
  const navigate = useNavigate();

  // Query all documents related to this patient
  const { data: documents, isLoading } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .filter('extracted_data->patient_info->id', 'eq', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!organizationId,
  });

  // Filter documents to show only validated certificates if needed
  const validatedDocuments = documents ? documents.filter(doc => 
    doc.status === 'processed' && 
    doc.extracted_data?.structured_data?.validated === true
  ) : [];

  const visits = documents ? groupDocumentsByDate(documents) : [];

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const handleCreateNewVisit = () => {
    // Navigate to document upload page with patient ID prefilled
    navigate(`/upload?patientId=${patientId}`);
  };

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return 'Unknown';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Visit History</CardTitle>
        <Button onClick={handleCreateNewVisit} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Visit
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
            <p className="text-muted-foreground mb-4">
              This patient doesn't have any recorded visits yet.
            </p>
            <Button onClick={handleCreateNewVisit} variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Record First Visit
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {visits.map((visit: any, index: number) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">
                      Visit on {format(new Date(visit.date), 'PP')}
                    </h3>
                  </div>
                  <Badge variant="outline">{visit.documents.length} document{visit.documents.length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="divide-y">
                  {visit.documents.map((doc: any) => (
                    <div key={doc.id} className="p-3 hover:bg-accent/30 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {doc.document_type && (
                              <Badge variant="secondary" className="capitalize">
                                {getDocumentTypeLabel(doc.document_type)}
                              </Badge>
                            )}
                            <Badge variant={doc.status === 'processed' ? 'success' : 'warning'} className="capitalize">
                              {doc.status}
                            </Badge>
                            {doc.extracted_data?.structured_data?.validated && (
                              <Badge variant="success">Validated</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          <FileText className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientVisits;
