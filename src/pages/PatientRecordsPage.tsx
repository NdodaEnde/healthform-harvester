
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import PatientVisits from '@/components/PatientVisits';

interface ExtractedData {
  structured_data?: {
    validated?: boolean;
    [key: string]: any;
  };
  patient_info?: {
    id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  status: string;
  document_type: string | null;
  processed_at: string | null;
  created_at: string;
  extracted_data: ExtractedData | null;
  [key: string]: any;
}

const PatientRecordsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const [documentType, setDocumentType] = useState<string>("all");
  const [showOnlyValidated, setShowOnlyValidated] = useState<boolean>(true);

  // Query patient information
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query patient documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['patient-documents', id, documentType, showOnlyValidated],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply organization filter
      query = query.eq('organization_id', organizationId);
      
      // Filter documents related to this patient
      query = query.filter('extracted_data->patient_info->id', 'eq', id);
      
      // Apply document type filter if not "all"
      if (documentType !== "all") {
        query = query.eq('document_type', documentType);
      }
      
      // Apply validation filter if enabled
      if (showOnlyValidated) {
        query = query.eq('status', 'processed');
        query = query.filter('extracted_data->structured_data->validated', 'eq', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Document[] || [];
    },
    enabled: !!id && !!organizationId,
  });

  const handleBackToPatient = () => {
    navigate(`/patients/${id}`);
  };

  const handleBackToList = () => {
    navigate('/patients');
  };

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const toggleValidationFilter = () => {
    setShowOnlyValidated(!showOnlyValidated);
  };

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button variant="outline" onClick={handleBackToList}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToPatient}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Medical Records
            </h1>
          </div>
          <p className="text-muted-foreground">
            {patient.first_name} {patient.last_name}'s medical records and documents
          </p>
        </div>
      </div>

      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visit History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="visits" className="mt-4">
          <PatientVisits patientId={id!} organizationId={organizationId} showOnlyValidated={showOnlyValidated} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="certificate_of_fitness">Certificates of Fitness</SelectItem>
                    <SelectItem value="medical_questionnaire">Medical Questionnaires</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant={showOnlyValidated ? "default" : "outline"} 
                  size="sm"
                  onClick={toggleValidationFilter}
                >
                  {showOnlyValidated ? "Showing Validated" : "Show All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                          <h3 className="font-medium">{doc.file_name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">
                              {format(new Date(doc.created_at), 'PP')}
                            </Badge>
                            {doc.document_type && (
                              <Badge variant="secondary" className="capitalize">
                                {doc.document_type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            <Badge 
                              variant={doc.status === 'processed' ? 'success' : 'warning'} 
                              className="capitalize"
                            >
                              {doc.status}
                            </Badge>
                            {doc.extracted_data?.structured_data?.validated && (
                              <Badge variant="success">Validated</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Document
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-background">
                  <h3 className="text-lg font-medium mb-2">No records found</h3>
                  <p className="text-muted-foreground">
                    {showOnlyValidated 
                      ? `No validated ${documentType !== "all" ? documentType.replace(/_/g, ' ') : ''} records found.`
                      : `This patient doesn't have any ${documentType !== "all" ? documentType.replace(/_/g, ' ') : ''} records yet.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientRecordsPage;
