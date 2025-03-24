
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ patientId, organizationId }) => {
  const navigate = useNavigate();

  // Query validated certificates related to this patient
  const { data: certificates, isLoading, error } = useQuery({
    queryKey: ['patient-certificates', patientId],
    queryFn: async () => {
      console.log('Fetching certificates for patient:', patientId);
      
      // The key fix: Use a more compatible approach for filtering JSON data
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .or(`document_type.eq.certificate-fitness,document_type.eq.certificate_of_fitness`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }
      
      // Filter the documents post-query to find those related to this patient and validated
      const filteredDocs = (data || []).filter(doc => {
        // Type assertion to handle the JSON type correctly
        const extractedData = doc.extracted_data as ExtractedData | null;
        const patientInfoId = extractedData?.patient_info?.id;
        const isValidated = extractedData?.structured_data?.validated === true;
        return patientInfoId === patientId && isValidated;
      });
      
      console.log('Certificates fetched:', filteredDocs.length);
      return filteredDocs as Document[];
    },
    enabled: !!patientId && !!organizationId,
  });

  const handleViewCertificate = (documentId: string) => {
    navigate(`/documents/${documentId}`);
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
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleViewCertificate(cert.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Certificate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-2">No certificates found</h3>
            <p className="text-muted-foreground">
              No validated certificates of fitness found for this patient.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientCertificates;
