import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, User, Phone, Mail, CalendarIcon, Edit, Clipboard } from 'lucide-react';
import { format } from 'date-fns';
import { PatientInfo } from '@/types/patient';
import { useOrganization } from '@/contexts/OrganizationContext';
import MedicalHistoryEditor from '@/components/MedicalHistoryEditor';
import PatientCertificates from '@/components/PatientCertificates';
import PatientVisits from '@/components/PatientVisits';

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      console.log('Patient data loaded:', data?.id, data?.first_name, data?.last_name);
      return data as PatientInfo;
    },
    enabled: !!id,
  });

  const handleBackToList = () => {
    navigate('/patients');
  };

  const handleEditPatient = () => {
    navigate(`/patients/${id}/edit`);
  };

  const handleViewMedicalRecords = () => {
    navigate(`/patients/${id}/records`);
  };

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

  if (isLoading) {
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

  const hasContact = patient.contact_info && (
    patient.contact_info.email || 
    patient.contact_info.phone || 
    patient.contact_info.address
  );

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
            {patient.gender ? `${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : 'Unknown gender'}{' '}
            • {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years old` : 'Unknown age'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleViewMedicalRecords}>
            <FileText className="mr-2 h-4 w-4" />
            Medical Records
          </Button>
          <Button onClick={handleEditPatient}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical-history">Medical History</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Full Name</dt>
                    <dd className="text-base flex items-center mt-1">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      {patient.first_name} {patient.last_name}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Date of Birth</dt>
                    <dd className="text-base flex items-center mt-1">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'PPP') : 'Not available'}
                      {patient.date_of_birth && ` (${calculateAge(patient.date_of_birth)} years old)`}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                    <dd className="text-base capitalize mt-1">
                      {patient.gender || 'Not specified'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                {hasContact ? (
                  <dl className="space-y-4">
                    {patient.contact_info?.phone && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                        <dd className="text-base flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          {patient.contact_info.phone}
                        </dd>
                      </div>
                    )}
                    
                    {patient.contact_info?.email && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd className="text-base flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {patient.contact_info.email}
                        </dd>
                      </div>
                    )}
                    
                    {patient.contact_info?.address && (
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Address</dt>
                        <dd className="text-base mt-1">
                          {patient.contact_info.address}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No contact information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.medical_history ? (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Medical Conditions</dt>
                      <dd className="text-base mt-1">
                        {patient.medical_history.conditions && patient.medical_history.conditions.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {patient.medical_history.conditions.map((condition, index) => (
                              <li key={index}>
                                {condition.name}
                                {condition.diagnosed_date && ` (diagnosed: ${condition.diagnosed_date})`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">None reported</span>
                        )}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Medications</dt>
                      <dd className="text-base mt-1">
                        {patient.medical_history.medications && patient.medical_history.medications.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {patient.medical_history.medications.map((med, index) => (
                              <li key={index}>
                                {med.name}
                                {med.dosage && ` (${med.dosage})`}
                                {med.frequency && `, ${med.frequency}`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">None reported</span>
                        )}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Allergies</dt>
                      <dd className="text-base mt-1">
                        {patient.medical_history.allergies && patient.medical_history.allergies.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {patient.medical_history.allergies.map((allergy, index) => (
                              <li key={index}>
                                {allergy.allergen}
                                {allergy.severity && ` (${allergy.severity})`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">None reported</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No medical history recorded</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleEditPatient}
                    >
                      <Clipboard className="mr-2 h-4 w-4" />
                      Add Medical History
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <PatientCertificates patientId={id!} organizationId={organizationId} />
          </div>
        </TabsContent>
        
        <TabsContent value="medical-history" className="mt-6">
          <MedicalHistoryEditor 
            patientId={id!}
            initialData={patient.medical_history || {}}
            onSave={async () => {}}
          />
        </TabsContent>
        
        <TabsContent value="visits" className="mt-6">
          <PatientVisits 
            patientId={id!} 
            organizationId={organizationId}
            showOnlyValidated={false} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetailPage;
