import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { CheckCircle, XCircle, AlertTriangle, FileText, User, Building, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CertificateData {
  id: string;
  file_name: string;
  extracted_data: any;
  status: string;
  created_at: string;
  owner_id?: string;
}

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
}

const CertificateValidator = () => {
  const { currentOrganization } = useOrganization();
  const [documents, setDocuments] = useState<CertificateData[]>([]);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [validationNotes, setValidationNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchCertificateDocuments();
      fetchPatients();
    }
  }, [currentOrganization?.id]);

  const fetchCertificateDocuments = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_name, extracted_data, status, created_at, owner_id')
        .eq('organization_id', currentOrganization.id)
        .eq('document_type', 'certificate-fitness')
        .eq('status', 'processed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedDocuments: CertificateData[] = (data || []).map(doc => ({
        id: doc.id || '',
        file_name: doc.file_name || '',
        extracted_data: doc.extracted_data,
        status: doc.status || '',
        created_at: doc.created_at || '',
        owner_id: doc.owner_id
      }));
      setDocuments(typedDocuments);
    } catch (error) {
      console.error('Error fetching certificate documents:', error);
      toast.error('Failed to fetch certificate documents');
    }
  };

  const fetchPatients = async () => {
    if (!currentOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      const typedPatients: PatientInfo[] = (data || []).map(patient => ({
        id: patient.id || '',
        first_name: patient.first_name || '',
        last_name: patient.last_name || ''
      }));
      setPatients(typedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidation = async (documentId: string, isValid: boolean) => {
    try {
      const validationStatus = isValid ? 'validated' : 'invalid';
      const note = validationNotes[documentId] || '';
      
      // Update the document with validation information
      const updateData = {
        extracted_data: {
          ...documents.find(d => d.id === documentId)?.extracted_data,
          validation_status: validationStatus,
          validation_note: note,
          validated_at: new Date().toISOString(),
        }
      };
      
      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      toast.success(`Certificate ${isValid ? 'validated' : 'marked as invalid'} successfully`);
      
      // Refresh the documents list
      await fetchCertificateDocuments();
      
      // Clear the validation note
      setValidationNotes(prev => ({ ...prev, [documentId]: '' }));
      
    } catch (error) {
      console.error('Error updating validation:', error);
      toast.error('Failed to update validation status');
    }
  };

  const getPatientName = (ownerId?: string) => {
    if (!ownerId) return 'Unknown Patient';
    const patient = patients.find(p => p.id === ownerId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient';
  };

  const getCertificateInfo = (extractedData: any) => {
    const structuredData = extractedData?.structured_data;
    if (!structuredData) return null;

    return {
      patientName: structuredData.patient?.name || structuredData.employee_name,
      company: structuredData.company?.name || structuredData.company_name,
      fitnessStatus: structuredData.fitness_status || structuredData.certificate_info?.fitness_status,
      examinationDate: structuredData.examination_date || structuredData.certificate_info?.examination_date,
      restrictions: structuredData.restrictions || [],
      medicalTests: structuredData.medical_tests || {}
    };
  };

  const getValidationStatus = (extractedData: any) => {
    return extractedData?.validation_status || 'pending';
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Validated</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Validator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Certificate Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Review and validate processed medical certificates. Ensure all extracted information is accurate.
          </div>
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No certificate documents found for validation.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const certInfo = getCertificateInfo(doc.extracted_data);
                const validationStatus = getValidationStatus(doc.extracted_data);
                
                return (
                  <Card key={doc.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{doc.file_name}</span>
                        </div>
                        {getValidationBadge(validationStatus)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {certInfo && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <strong>Patient:</strong> {certInfo.patientName || getPatientName(doc.owner_id)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <strong>Company:</strong> {certInfo.company || 'Not specified'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                <strong>Examination:</strong> {certInfo.examinationDate || 'Not specified'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <strong className="text-sm">Fitness Status:</strong>
                              <div className="mt-1">
                                {certInfo.fitnessStatus ? (
                                  <Badge variant="outline">{certInfo.fitnessStatus}</Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not specified</span>
                                )}
                              </div>
                            </div>
                            {certInfo.restrictions && certInfo.restrictions.length > 0 && (
                              <div>
                                <strong className="text-sm">Restrictions:</strong>
                                <div className="mt-1 space-y-1">
                                  {certInfo.restrictions.map((restriction: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="mr-1">
                                      {restriction}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {validationStatus === 'pending' && (
                        <div className="space-y-3 pt-4 border-t">
                          <Textarea
                            placeholder="Add validation notes (optional)..."
                            value={validationNotes[doc.id] || ''}
                            onChange={(e) => setValidationNotes(prev => ({ ...prev, [doc.id]: e.target.value }))}
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleValidation(doc.id, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validate Certificate
                            </Button>
                            <Button
                              onClick={() => handleValidation(doc.id, false)}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark as Invalid
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {validationStatus !== 'pending' && doc.extracted_data?.validation_note && (
                        <div className="pt-4 border-t">
                          <strong className="text-sm">Validation Note:</strong>
                          <p className="text-sm text-muted-foreground mt-1">{doc.extracted_data.validation_note}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateValidator;
