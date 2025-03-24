
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Loader2, Edit, ArrowLeft, FileText, Calendar } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import PatientVisits from '@/components/PatientVisits';
import { MedicalHistoryData, PatientInfo } from '@/types/patient';

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
      return data as PatientInfo;
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

  // Query questionnaire data
  const { data: questionnaires, isLoading: isLoadingQuestionnaires } = useQuery({
    queryKey: ['patient-questionnaires', id],
    queryFn: async () => {
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'medical_questionnaire')
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
  const getContactInfo = () => {
    if (patient.contact_info && typeof patient.contact_info === 'object') {
      return patient.contact_info;
    }
    return {};
  };

  const contactInfo = getContactInfo();

  // Helper to safely access medical history data
  const getMedicalHistory = (): MedicalHistoryData => {
    if (!patient.medical_history) return {};
    if (typeof patient.medical_history === 'object') {
      return patient.medical_history as MedicalHistoryData;
    }
    try {
      if (typeof patient.medical_history === 'string') {
        return JSON.parse(patient.medical_history) as MedicalHistoryData;
      }
    } catch (e) {
      console.error("Failed to parse medical_history", e);
    }
    return {};
  };

  const medicalHistory = getMedicalHistory();

  // Function to render medical condition list
  const renderConditions = () => {
    const conditions = medicalHistory.conditions || [];
    if (conditions.length === 0) {
      return <p className="text-muted-foreground">No conditions recorded</p>;
    }
    
    return (
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={index} className="border p-3 rounded-lg">
            <h4 className="font-medium">{condition.name}</h4>
            {condition.diagnosed_date && (
              <p className="text-sm text-muted-foreground">
                Diagnosed: {format(new Date(condition.diagnosed_date), 'PP')}
              </p>
            )}
            {condition.notes && <p className="text-sm mt-1">{condition.notes}</p>}
          </div>
        ))}
      </div>
    );
  };

  // Function to render medications list
  const renderMedications = () => {
    const medications = medicalHistory.medications || [];
    if (medications.length === 0) {
      return <p className="text-muted-foreground">No medications recorded</p>;
    }
    
    return (
      <div className="space-y-3">
        {medications.map((medication, index) => (
          <div key={index} className="border p-3 rounded-lg">
            <h4 className="font-medium">{medication.name}</h4>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {medication.dosage && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Dosage:</span> {medication.dosage}
                </p>
              )}
              {medication.frequency && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Frequency:</span> {medication.frequency}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to render allergies list
  const renderAllergies = () => {
    const allergies = medicalHistory.allergies || [];
    if (allergies.length === 0) {
      return <p className="text-muted-foreground">No allergies recorded</p>;
    }
    
    const getSeverityColor = (severity?: string) => {
      switch (severity) {
        case 'severe': return 'text-red-500';
        case 'moderate': return 'text-amber-500';
        case 'mild': return 'text-yellow-500';
        default: return '';
      }
    };
    
    return (
      <div className="space-y-3">
        {allergies.map((allergy, index) => (
          <div key={index} className="border p-3 rounded-lg">
            <div className="flex justify-between">
              <h4 className="font-medium">{allergy.allergen}</h4>
              {allergy.severity && (
                <span className={`text-sm font-medium ${getSeverityColor(allergy.severity)}`}>
                  {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                </span>
              )}
            </div>
            {allergy.reaction && <p className="text-sm mt-1">{allergy.reaction}</p>}
          </div>
        ))}
      </div>
    );
  };

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
          <TabsTrigger value="visits">Visits</TabsTrigger>
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
              <div className="grid gap-4 sm:grid-cols-3">
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
                  {isLoadingQuestionnaires ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : questionnaires && questionnaires.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm">{questionnaires.length} questionnaire(s) available</p>
                      <div>
                        <Button variant="link" size="sm" onClick={() => navigate(`/patients/${id}/records`)}>
                          View all questionnaires
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No questionnaires available</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Recent Visits</h3>
                  {medicalHistory.documents && medicalHistory.documents.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm">{medicalHistory.documents.length} document(s) from visits</p>
                      <div>
                        <Button variant="link" size="sm" onClick={() => navigate(`/patients/${id}/records`)}>
                          View all visits
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No visit records available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <PatientVisits patientId={id!} organizationId={organizationId} />
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
              {isLoadingQuestionnaires ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : questionnaires && questionnaires.length > 0 ? (
                <div className="space-y-4">
                  {questionnaires.map(doc => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{doc.file_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Completed: {format(new Date(doc.processed_at || doc.created_at), 'PP')}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            Questionnaire
                          </Badge>
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
                  <p>No questionnaires found for this patient.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Medical Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {renderConditions()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Medications</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMedications()}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAllergies()}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Common Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p>Hypertension</p>
                    <Badge variant={medicalHistory.has_hypertension ? 'success' : 'outline'}>
                      {medicalHistory.has_hypertension ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p>Diabetes</p>
                    <Badge variant={medicalHistory.has_diabetes ? 'success' : 'outline'}>
                      {medicalHistory.has_diabetes ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p>Heart Disease</p>
                    <Badge variant={medicalHistory.has_heart_disease ? 'success' : 'outline'}>
                      {medicalHistory.has_heart_disease ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p>Allergies</p>
                    <Badge variant={medicalHistory.has_allergies ? 'success' : 'outline'}>
                      {medicalHistory.has_allergies ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {medicalHistory.notes && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium mb-2">Additional Notes</h3>
                  <p className="text-sm">{medicalHistory.notes}</p>
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
