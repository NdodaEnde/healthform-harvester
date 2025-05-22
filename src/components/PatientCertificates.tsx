
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, AlertCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CertificateTemplate from '@/components/CertificateTemplate';
import EnhancedCertificateGenerator from '@/components/certificates/EnhancedCertificateGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface PatientCertificatesProps {
  patientId: string;
  organizationId: string;
}

interface ExtractedData {
  structured_data?: {
    validated?: boolean;
    certification?: {
      valid_until?: string;
      examination_date?: string;
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
      date?: string;
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

// Function to determine the fitness status color
const getFitnessStatusColor = (document: Document) => {
  const certification = document.extracted_data?.structured_data?.certification;
  
  if (certification?.fit) return "success";
  if (certification?.fit_with_restrictions) return "warning";
  if (certification?.temporarily_unfit || certification?.unfit) return "destructive";
  
  return "secondary";
};

// Function to format fitness status text
const getFitnessStatusText = (document: Document) => {
  const certification = document.extracted_data?.structured_data?.certification;
  const results = document.extracted_data?.structured_data?.examination_results;
  
  if (certification?.fit) return "Fit";
  if (certification?.fit_with_restrictions) return "Fit with Restrictions";
  if (certification?.temporarily_unfit) return "Temporarily Unfit";
  if (certification?.unfit) return "Unfit";
  
  // Fallback to examination_results if available
  return results?.fitness_status || "Unknown";
};

// Helper function to get document review status from localStorage
const getDocumentReviewStatus = (documentId: string): ReviewStatus => {
  return localStorage.getItem(`doc-review-${documentId}`) as ReviewStatus || 'not-reviewed';
};

// Helper function to get examination date based on valid_until date
// Assuming examination date is typically one year before expiry date
export const getExaminationDate = (validUntil: string | undefined): string | null => {
  if (!validUntil) return null;
  
  try {
    const expiryDate = new Date(validUntil);
    if (isNaN(expiryDate.getTime())) return null;
    
    // Get date one year before expiry
    const examDate = new Date(expiryDate);
    examDate.setFullYear(examDate.getFullYear() - 1);
    return examDate.toISOString().split('T')[0];
  } catch (e) {
    console.error('Error calculating examination date:', e);
    return null;
  }
};

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ patientId, organizationId }) => {
  const navigate = useNavigate();
  const [selectedCertificate, setSelectedCertificate] = useState<Document | null>(null);
  const [isGeneratorDialogOpen, setIsGeneratorDialogOpen] = useState(false);

  // Query to fetch patient details to assist with matching
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

  // Query certificates related to this patient with enhanced matching, showing all certificates
  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ['patient-certificates', patientId, patient?.first_name, patient?.last_name],
    queryFn: async () => {
      console.log('Fetching certificates for patient:', patientId);
      console.log('Patient name:', patient?.first_name, patient?.last_name);
      
      // Get all processed documents of certificate types
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
      
      console.log('Raw processed documents fetched:', data?.length);
      
      // Enhanced multi-strategy matching without validation filter
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
      const docsWithReviewStatus = filteredDocs.map(doc => {
        // Add calculated examination date if missing but has valid_until
        const extractedData = doc.extracted_data as ExtractedData | null;
        if (extractedData?.structured_data?.certification?.valid_until && 
            !extractedData?.structured_data?.certification?.examination_date && 
            !extractedData?.structured_data?.examination_results?.date) {
          
          const examDate = getExaminationDate(extractedData.structured_data.certification.valid_until);
          if (examDate && extractedData.structured_data.certification) {
            extractedData.structured_data.certification.examination_date = examDate;
          }
        }
        
        return {
          ...doc,
          reviewStatus: getDocumentReviewStatus(doc.id)
        };
      });
      
      console.log('Certificates after filtering:', docsWithReviewStatus.length);
      return docsWithReviewStatus as (Document & { reviewStatus: ReviewStatus })[];
    },
    enabled: !!patientId && !!organizationId && !!patient,
  });

  // State for direct certificate viewing
  const [viewingCertificate, setViewingCertificate] = useState<Document | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const handleViewCertificate = (certificate: Document) => {
    setViewingCertificate(certificate);
    setIsViewDialogOpen(true);
  };

  // Filter for only reviewed certificates if needed
  // Uncomment this to show only reviewed certificates
  // const reviewedCertificates = certificates?.filter(cert => cert.reviewStatus === 'reviewed') || [];

  return (
    <>
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewCertificate(cert)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Certificate
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => {
                            // Open a dialog to show the certificate with download options
                            setSelectedCertificate(cert);
                            setIsGeneratorDialogOpen(true);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download/Print
                        </Button>
                      </div>
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
      
      {/* Certificate Generator Dialog */}
      <Dialog open={isGeneratorDialogOpen} onOpenChange={setIsGeneratorDialogOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Certificate Options</DialogTitle>
            <DialogDescription>
              Download, print, or email this certificate
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedCertificate && (
              <EnhancedCertificateGenerator 
                documentId={selectedCertificate.id} 
                onClose={() => setIsGeneratorDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Certificate View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Certificate of Fitness</DialogTitle>
            <DialogDescription>
              {viewingCertificate?.file_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {viewingCertificate && (
              <div className="p-4">
                <CertificateTemplate extractedData={viewingCertificate.extracted_data} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientCertificates;
