
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Plus, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PatientVisitsProps {
  patientId: string;
  organizationId: string;
  showOnlyValidated?: boolean;
}

// Define a type for the extracted data structure
interface ExtractedData {
  structured_data?: {
    validated?: boolean;
    certification?: {
      examination_date?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  patient_info?: {
    id?: string;
    [key: string]: any;
  };
  raw_content?: string;
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

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

// Helper function to get document review status from localStorage
const getDocumentReviewStatus = (documentId: string): ReviewStatus => {
  return localStorage.getItem(`doc-review-${documentId}`) as ReviewStatus || 'not-reviewed';
};

// Group documents by date to represent visits
const groupDocumentsByDate = (documents: Document[]) => {
  const visits = documents.reduce((acc: any, doc: Document) => {
    // Try to get examination date from certificate first
    let visitDate = null;
    
    if (doc.extracted_data?.structured_data?.certification?.examination_date) {
      visitDate = doc.extracted_data.structured_data.certification.examination_date;
    } else {
      // Fall back to processed or created date
      visitDate = doc.processed_at || doc.created_at;
    }
    
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

// Helper function to check if a document has structured data
const hasStructuredData = (doc: Document): boolean => {
  const structData = doc.extracted_data?.structured_data;
  return !!structData && Object.keys(structData).length > 0;
};

// Helper function to check if document has raw content
const hasRawContent = (doc: Document): boolean => {
  return !!doc.extracted_data?.raw_content && doc.extracted_data.raw_content.length > 0;
};

// Helper function to check if a document is validated
const isDocumentValidated = (doc: Document): boolean => {
  return doc.extracted_data?.structured_data?.validated === true;
};

const PatientVisits: React.FC<PatientVisitsProps> = ({ patientId, organizationId, showOnlyValidated = false }) => {
  const navigate = useNavigate();

  // Query to fetch patient details to assist with matching
  const { data: patient } = useQuery({
    queryKey: ['patient-details-for-visits', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  // Query all documents related to this patient
  const { data: documents, isLoading } = useQuery({
    queryKey: ['patient-visits-documents', patientId, showOnlyValidated, patient?.first_name, patient?.last_name],
    queryFn: async () => {
      console.log('Fetching documents for patient visits:', patientId);
      console.log('Patient name for visits:', patient?.first_name, patient?.last_name);
      
      // Get all processed documents for this organization
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'failed') // Skip failed documents
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching visit documents:', error);
        throw error;
      }
      
      console.log('Raw documents fetched for visits:', data?.length);
      
      // Enhanced multi-strategy matching like in PatientCertificates
      const filteredDocs = (data || []).filter(doc => {
        const extractedData = doc.extracted_data as ExtractedData | null;
        
        // Strategy 1: Direct patient ID match in patient_info
        if (extractedData?.patient_info?.id === patientId) {
          console.log('Match by patient_info.id:', doc.id);
          return true;
        }
        
        // Strategy 2: Patient name match in structured data
        const patientName = patient ? 
          `${patient.first_name} ${patient.last_name}`.toLowerCase() : '';
          
        const patientNameInData = extractedData?.structured_data?.patient?.name?.toLowerCase() || 
                              extractedData?.patient_info?.name?.toLowerCase() || '';
        
        if (patientName && patientNameInData && patientNameInData.includes(patientName)) {
          console.log('Match by patient name in data:', doc.id);
          return true;
        }
        
        // Strategy 3: Patient name in filename (simplified)
        const fileName = doc.file_name.toLowerCase();
        
        if (patient?.first_name && fileName.includes(patient.first_name.toLowerCase())) {
          console.log('Match by first name in filename:', doc.id);
          return true;
        }
        
        if (patient?.last_name && fileName.includes(patient.last_name.toLowerCase())) {
          console.log('Match by last name in filename:', doc.id);
          return true;
        }
        
        // Strategy 4: Patient ID in filename
        if (fileName.includes(patientId.toLowerCase())) {
          console.log('Match by patient ID in filename:', doc.id);
          return true;
        }
        
        console.log('No match for document:', doc.id, doc.file_name);
        return false;
      });
      
      // Add review status from localStorage to each document
      const docsWithReviewStatus = filteredDocs.map(doc => ({
        ...doc,
        reviewStatus: getDocumentReviewStatus(doc.id)
      }));
      
      console.log('Visit documents after filtering:', docsWithReviewStatus.length);
      return docsWithReviewStatus as (Document & { reviewStatus: ReviewStatus })[];
    },
    enabled: !!patientId && !!organizationId && !!patient,
  });

  // Filter documents based on review status or validation status if needed
  const filteredDocuments = documents ? documents.filter(doc => {
    if (showOnlyValidated) {
      return doc.reviewStatus === 'reviewed' || isDocumentValidated(doc);
    }
    return true;
  }) : [];

  console.log('Filtered visit documents:', filteredDocuments?.length, 'out of', documents?.length);
  
  const visits = filteredDocuments?.length ? groupDocumentsByDate(filteredDocuments) : [];
  console.log('Grouped visits:', visits.length);

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

  // Get appropriate status badge for a document
  const getStatusBadge = (doc: Document & { reviewStatus: ReviewStatus }) => {
    // First check review status
    if (doc.reviewStatus === 'reviewed') {
      return <Badge variant="success">Reviewed</Badge>;
    }
    
    if (doc.reviewStatus === 'needs-correction') {
      return <Badge variant="destructive">Needs Correction</Badge>;
    }
    
    // Then check processing status
    switch (doc.status) {
      case 'processed':
        if (isDocumentValidated(doc)) {
          return <Badge variant="success">Validated</Badge>;
        }
        if (hasStructuredData(doc)) {
          return <Badge variant="outline">Processed</Badge>;
        }
        if (hasRawContent(doc)) {
          return <Badge variant="warning">Extracted</Badge>;
        }
        return <Badge variant="outline">Processed</Badge>;
        
      case 'extracted':
        return <Badge variant="warning">Text Only</Badge>;
        
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
        
      default:
        return <Badge variant="outline">Not Reviewed</Badge>;
    }
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
              {showOnlyValidated 
                ? "This patient doesn't have any reviewed visits yet."
                : "This patient doesn't have any recorded visits yet."}
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
                            <Badge variant={
                              doc.status === 'processed' ? 'success' : 
                              doc.status === 'extracted' ? 'warning' : 
                              'outline'
                            } className="capitalize">
                              {doc.status}
                            </Badge>
                            {getStatusBadge(doc)}
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
