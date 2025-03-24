
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Loader2, Edit, ArrowLeft, FileText } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ContactInfo {
  email?: string;
  phone?: string;
  company?: string;
  occupation?: string;
  address?: string;
  [key: string]: any;
}

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Query patient data
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

  // Query certificate data linked to this patient
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['patient-certificates', id],
    queryFn: async () => {
      // First get documents linked to the patient
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'certificate_of_fitness')
        .eq('organization_id', organizationId)
        .filter('extracted_data->patient_info->id', 'eq', id);
      
      if (docError) throw docError;
      
      if (!documents || documents.length === 0) {
        return [];
      }
      
      return documents;
    },
    enabled: !!id && !!organizationId,
  });

  const handleBackToList = () => {
    navigate('/patients');
  };

  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  const handleViewRecords = () => {
    navigate(`/patients/${id}/records`);
  };

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
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

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Type guard to ensure contact_info is an object with expected properties
  const getContactInfo = (): ContactInfo => {
    if (patient.contact_info && typeof patient.contact_info === 'object') {
      return patient.contact_info as ContactInfo;
    }
    return {};
  };

  const contactInfo = getContactInfo();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {patient.first_name} {patient.last_name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Patient profile and medical records
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleViewRecords} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Records
          </Button>
          <Button onClick={handleEditPatient}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{format(new Date(patient.date_of_birth), 'PP')}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{calculateAge(patient.date_of_birth)} years</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{patient.gender || 'Unknown'}</p>
              </div>
              
              {contactInfo.email && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contactInfo.email}</p>
                </div>
              )}
              
              {contactInfo.phone && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{contactInfo.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Records Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-2">Certificates of Fitness</h3>
                  {isLoadingCertificates ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : certificates && certificates.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm">{certificates.length} certificate(s) available</p>
                      <div>
                        <Button variant="link" size="sm" onClick={() => navigate(`/patients/${id}/records`)}>
                          View all certificates
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No certificates available</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Medical Questionnaires</h3>
                  <p className="text-sm text-muted-foreground">No questionnaires available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificates of Fitness</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCertificates ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : certificates && certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{doc.file_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Processed: {format(new Date(doc.processed_at || doc.created_at), 'PP')}
                          </p>
                          {doc.document_type && (
                            <Badge variant="outline" className="mt-2">
                              {doc.document_type.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          View Document
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p>No certificates found for this patient.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaires" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Questionnaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p>Medical questionnaire support coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medical_history ? (
                <div className="space-y-4">
                  {Object.entries(patient.medical_history).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="font-medium capitalize">{key.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">{String(value)}</p>
                      <Separator className="my-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p>No medical history information available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailPage;
