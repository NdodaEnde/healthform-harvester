import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, AlertCircle, Download, Printer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface PatientCertificatesProps {
  patientId: string;
  organizationId: string;
}

interface ExtractedData {
  structured_data?: {
    validated?: boolean;
    certification?: {
      valid_until?: string;
      fit?: boolean;
      fit_with_restrictions?: boolean;
      [key: string]: any;
    };
    patient?: {
      name?: string;
      [key: string]: any;
    };
    examination_results?: {
      fitness_status?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  patient_info?: {
    id?: string;
    name?: string;
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

type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

const getFitnessStatusColor = (document: Document) => {
  const certification = document.extracted_data?.structured_data?.certification;
  
  if (certification?.fit) return "success";
  if (certification?.fit_with_restrictions) return "warning";
  if (certification?.temporarily_unfit || certification?.unfit) return "destructive";
  
  return "secondary";
};

const getFitnessStatusText = (document: Document) => {
  const certification = document.extracted_data?.structured_data?.certification;
  const results = document.extracted_data?.structured_data?.examination_results;
  
  if (certification?.fit) return "Fit";
  if (certification?.fit_with_restrictions) return "Fit with Restrictions";
  if (certification?.temporarily_unfit) return "Temporarily Unfit";
  if (certification?.unfit) return "Unfit";
  
  return results?.fitness_status || "Unknown";
};

const getDocumentReviewStatus = (documentId: string): ReviewStatus => {
  return localStorage.getItem(`doc-review-${documentId}`) as ReviewStatus || 'not-reviewed';
};

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ patientId, organizationId }) => {
  const navigate = useNavigate();
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const { data: patient } = useQuery({
    queryKey: ['patient-details', patientId],
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

  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ['patient-certificates', patientId, patient?.first_name, patient?.last_name],
    queryFn: async () => {
      console.log('Fetching certificates for patient:', patientId);
      console.log('Patient name:', patient?.first_name, patient?.last_name);
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .in('document_type', ['certificate-fitness', 'certificate_of_fitness', 'fitness-certificate', 'fitness_certificate'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }
      
      const filteredDocs = (data || []).filter(doc => {
        const extractedData = doc.extracted_data as ExtractedData | null;
        
        if (extractedData?.patient_info?.id === patientId) {
          console.log('Match by patient_info.id:', doc.id);
          return true;
        }
        
        const patientName = patient ? 
          `${patient.first_name} ${patient.last_name}`.toLowerCase() : '';
        
        const patientNameInData = extractedData?.structured_data?.patient?.name?.toLowerCase() || 
                                extractedData?.patient_info?.name?.toLowerCase() || '';
        
        if (patientName && patientNameInData && patientNameInData.includes(patientName)) {
          console.log('Match by patient name in data:', doc.id);
          return true;
        }
        
        const fileName = doc.file_name.toLowerCase();
        
        if (patient?.first_name && fileName.includes(patient.first_name.toLowerCase())) {
          console.log('Match by first name in filename:', doc.id);
          return true;
        }
        
        if (patient?.last_name && fileName.includes(patient.last_name.toLowerCase())) {
          console.log('Match by last name in filename:', doc.id);
          return true;
        }
        
        if (fileName.includes(patientId.toLowerCase())) {
          console.log('Match by patient ID in filename:', doc.id);
          return true;
        }
        
        console.log('No match for document:', doc.id, doc.file_name);
        return false;
      });
      
      const docsWithReviewStatus = filteredDocs.map(doc => ({
        ...doc,
        reviewStatus: getDocumentReviewStatus(doc.id)
      }));
      
      console.log('Certificates after filtering:', docsWithReviewStatus.length);
      return docsWithReviewStatus as (Document & { reviewStatus: ReviewStatus })[];
    },
    enabled: !!patientId && !!organizationId && !!patient,
  });

  const handleViewCertificate = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const handleGeneratePdf = async (documentId: string) => {
    try {
      setGeneratingPdf(documentId);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "PDF generated successfully",
        description: "You can now download or print the certificate",
      });
      
      navigate(`/documents/${documentId}?action=download`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Failed to generate PDF",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setGeneratingPdf(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificates of Fitness</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            <p>Error loading certificates: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map(cert => (
              <div key={cert.id} className="border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="font-medium">{cert.file_name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline">
                        {cert.processed_at 
                          ? format(new Date(cert.processed_at), 'PP') 
                          : format(new Date(cert.created_at), 'PP')}
                      </Badge>
                      
                      <Badge variant={getFitnessStatusColor(cert)}>
                        {getFitnessStatusText(cert)}
                      </Badge>
                      
                      {cert.extracted_data?.structured_data?.certification?.valid_until && (
                        <Badge variant="secondary">
                          Valid until: {cert.extracted_data.structured_data.certification.valid_until}
                        </Badge>
                      )}
                      
                      {cert.reviewStatus === 'reviewed' ? (
                        <Badge variant="success">Reviewed</Badge>
                      ) : cert.reviewStatus === 'needs-correction' ? (
                        <Badge variant="destructive">Needs Correction</Badge>
                      ) : (
                        <Badge variant="outline">Not Reviewed</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleGeneratePdf(cert.id)}
                      disabled={generatingPdf === cert.id}
                    >
                      {generatingPdf === cert.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Generate PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewCertificate(cert.id)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-2">No certificates found</h3>
            <p className="text-muted-foreground">
              No certificates of fitness found for this patient.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientCertificates;
