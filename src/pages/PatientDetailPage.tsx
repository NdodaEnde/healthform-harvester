
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, User, Phone, Mail, CalendarIcon, Edit, Clipboard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { PatientInfo } from '@/types/patient';
import { useOrganization } from '@/contexts/OrganizationContext';
import MedicalHistoryEditor from '@/components/MedicalHistoryEditor';
import PatientCertificates from '@/components/PatientCertificates';
import PatientVisits from '@/components/PatientVisits';
import { Separator } from '@/components/ui/separator';

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

  // Fetch certificates summary data for the patient
  const { data: certificatesSummary } = useQuery({
    queryKey: ['patient-certificates-summary', id, organizationId],
    queryFn: async () => {
      console.log('Fetching certificates summary for patient:', id);
      
      if (!id || !organizationId) return null;
      
      // Get all processed documents of certificate types
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'processed')
        .in('document_type', ['certificate-fitness', 'certificate_of_fitness', 'fitness-certificate', 'fitness_certificate'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching certificates summary:', error);
        throw error;
      }
      
      // Filter for this patient (simplified matching)
      const patientCertificates = (data || []).filter(doc => {
        const extractedData = doc.extracted_data;
        
        // Simple patient matching
        if (extractedData?.patient_info?.id === id) return true;
        
        // Name-based matching
        if (patient && extractedData?.structured_data?.patient?.name) {
          const patientName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
          const nameInData = extractedData.structured_data.patient.name.toLowerCase();
          if (nameInData.includes(patientName)) return true;
        }
        
        // File name matching
        if (patient && doc.file_name) {
          const fileName = doc.file_name.toLowerCase();
          if (
            (patient.first_name && fileName.includes(patient.first_name.toLowerCase())) ||
            (patient.last_name && fileName.includes(patient.last_name.toLowerCase())) ||
            fileName.includes(id.toLowerCase())
          ) {
            return true;
          }
        }
        
        return false;
      });
      
      // Find latest expiration date
      let latestExpiration = null;
      for (const cert of patientCertificates) {
        const expiryDate = cert.extracted_data?.structured_data?.certification?.valid_until;
        if (expiryDate) {
          try {
            const expiryDateObj = new Date(expiryDate);
            if (!latestExpiration || expiryDateObj > latestExpiration) {
              latestExpiration = expiryDateObj;
            }
          } catch (e) {
            console.log('Invalid date format:', expiryDate);
          }
        }
      }
      
      return {
        count: patientCertificates.length,
        latestExpiration: latestExpiration ? format(latestExpiration, 'PPP') : null
      };
    },
    enabled: !!id && !!organizationId && !!patient,
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

  // Use real data from patient object for EHR tabs
  const ehrData = {
    personal: {
      fullName: `${patient.first_name} ${patient.last_name}`,
      dateOfBirth: patient.date_of_birth ? format(new Date(patient.date_of_birth), 'PPP') : 'Not available',
      gender: patient.gender || 'Not specified',
      employeeId: patient.contact_info?.employee_id || 'N/A',
      address: patient.contact_info?.address || 'N/A',
      phoneNumber: patient.contact_info?.phone || 'N/A',
      email: patient.contact_info?.email || 'N/A',
      occupation: patient.contact_info?.occupation || 'N/A',
      employer: patient.contact_info?.company || 'N/A'
    },
    medical: {
      allergies: (patient.medical_history?.allergies && patient.medical_history.allergies.length > 0) 
        ? patient.medical_history.allergies.map(a => a.allergen).join(", ") 
        : 'None reported',
      currentMedications: (patient.medical_history?.medications && patient.medical_history.medications.length > 0) 
        ? patient.medical_history.medications.map(m => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`).join(", ") 
        : 'None reported',
      chronicConditions: (patient.medical_history?.conditions && patient.medical_history.conditions.length > 0) 
        ? patient.medical_history.conditions.map(c => c.name).join(", ") 
        : 'None reported',
      previousSurgeries: patient.medical_history?.surgeries || 'None reported',
      familyHistory: patient.medical_history?.family_history || 'Not available',
      smoker: patient.medical_history?.smoker ? 'Yes' : 'No',
      alcoholConsumption: patient.medical_history?.alcohol_consumption || 'Not reported',
      exerciseFrequency: patient.medical_history?.exercise_frequency || 'Not reported'
    },
    vitals: {
      height: patient.medical_history?.vitals?.height || 'N/A',
      weight: patient.medical_history?.vitals?.weight || 'N/A',
      bmi: patient.medical_history?.vitals?.bmi || 'N/A',
      bloodPressure: patient.medical_history?.vitals?.blood_pressure || 'N/A',
      heartRate: patient.medical_history?.vitals?.heart_rate || 'N/A',
      respiratoryRate: patient.medical_history?.vitals?.respiratory_rate || 'N/A',
      temperature: patient.medical_history?.vitals?.temperature || 'N/A',
      oxygenSaturation: patient.medical_history?.vitals?.oxygen_saturation || 'N/A'
    },
    examResults: {
      vision: patient.medical_history?.exam_results?.vision || 'N/A',
      hearing: patient.medical_history?.exam_results?.hearing || 'N/A',
      lungFunction: patient.medical_history?.exam_results?.lung_function || 'N/A',
      chestXRay: patient.medical_history?.exam_results?.chest_xray || 'N/A',
      laboratory: patient.medical_history?.exam_results?.laboratory || 'N/A'
    },
    assessment: {
      diagnosis: patient.medical_history?.assessment?.diagnosis || 'N/A',
      recommendations: patient.medical_history?.assessment?.recommendations || 'N/A',
      restrictions: patient.medical_history?.assessment?.restrictions || 'N/A',
      fitnessConclusion: patient.medical_history?.assessment?.fitness_conclusion || 'N/A'
    }
  };

  const renderSectionItem = (label: string, value: string) => (
    <div className="mb-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base mt-1">{value}</dd>
    </div>
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
          <TabsTrigger value="ehr">EHR</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Certificates Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center flex-1 py-2 px-4 bg-muted/30 rounded-lg">
                      <h3 className="text-3xl font-semibold text-primary mb-1">
                        {certificatesSummary?.count ?? 0}
                      </h3>
                      <p className="text-muted-foreground text-sm">Total Certificates</p>
                    </div>
                    
                    <div className="text-center flex-1 py-2 px-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
                        <Calendar className="h-5 w-5" />
                        <h3 className="text-lg font-medium leading-none">
                          {certificatesSummary?.latestExpiration ?? 'N/A'}
                        </h3>
                      </div>
                      <p className="text-muted-foreground text-sm">Latest Expiration</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => document.querySelector('[data-state="inactive"][data-value="certificates"]')?.click()}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View All Certificates
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ehr" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="medical">Medical</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="examResults">Exam Results</TabsTrigger>
                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <Separator />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSectionItem("Full Name", ehrData.personal.fullName)}
                      {renderSectionItem("Date of Birth", ehrData.personal.dateOfBirth)}
                      {renderSectionItem("Gender", ehrData.personal.gender)}
                      {renderSectionItem("Employee ID", ehrData.personal.employeeId)}
                      {renderSectionItem("Address", ehrData.personal.address)}
                      {renderSectionItem("Phone Number", ehrData.personal.phoneNumber)}
                      {renderSectionItem("Email", ehrData.personal.email)}
                      {renderSectionItem("Occupation", ehrData.personal.occupation)}
                      {renderSectionItem("Employer", ehrData.personal.employer)}
                    </dl>
                  </div>
                </TabsContent>
                
                <TabsContent value="medical">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Medical Information</h3>
                    <Separator />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSectionItem("Allergies", ehrData.medical.allergies)}
                      {renderSectionItem("Current Medications", ehrData.medical.currentMedications)}
                      {renderSectionItem("Chronic Conditions", ehrData.medical.chronicConditions)}
                      {renderSectionItem("Previous Surgeries", ehrData.medical.previousSurgeries)}
                      {renderSectionItem("Family History", ehrData.medical.familyHistory)}
                      {renderSectionItem("Smoker", ehrData.medical.smoker)}
                      {renderSectionItem("Alcohol Consumption", ehrData.medical.alcoholConsumption)}
                      {renderSectionItem("Exercise Frequency", ehrData.medical.exerciseFrequency)}
                    </dl>
                  </div>
                </TabsContent>
                
                <TabsContent value="vitals">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vitals</h3>
                    <Separator />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSectionItem("Height", ehrData.vitals.height)}
                      {renderSectionItem("Weight", ehrData.vitals.weight)}
                      {renderSectionItem("BMI", ehrData.vitals.bmi)}
                      {renderSectionItem("Blood Pressure", ehrData.vitals.bloodPressure)}
                      {renderSectionItem("Heart Rate", ehrData.vitals.heartRate)}
                      {renderSectionItem("Respiratory Rate", ehrData.vitals.respiratoryRate)}
                      {renderSectionItem("Temperature", ehrData.vitals.temperature)}
                      {renderSectionItem("Oxygen Saturation", ehrData.vitals.oxygenSaturation)}
                    </dl>
                  </div>
                </TabsContent>
                
                <TabsContent value="examResults">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Exam Results</h3>
                    <Separator />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSectionItem("Vision", ehrData.examResults.vision)}
                      {renderSectionItem("Hearing", ehrData.examResults.hearing)}
                      {renderSectionItem("Lung Function", ehrData.examResults.lungFunction)}
                      {renderSectionItem("Chest X-Ray", ehrData.examResults.chestXRay)}
                      {renderSectionItem("Laboratory", ehrData.examResults.laboratory)}
                    </dl>
                  </div>
                </TabsContent>
                
                <TabsContent value="assessment">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Assessment</h3>
                    <Separator />
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSectionItem("Diagnosis", ehrData.assessment.diagnosis)}
                      {renderSectionItem("Recommendations", ehrData.assessment.recommendations)}
                      {renderSectionItem("Restrictions", ehrData.assessment.restrictions)}
                      {renderSectionItem("Fitness Conclusion", ehrData.assessment.fitnessConclusion)}
                    </dl>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="mt-6">
          <PatientCertificates patientId={id!} organizationId={organizationId} />
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
