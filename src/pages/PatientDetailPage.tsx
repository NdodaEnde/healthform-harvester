import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PatientInfo } from '@/types/patient';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/contexts/OrganizationContext';
import PatientVisits from '@/components/PatientVisits';
import { ArrowLeft, Edit, Calendar, User, Mail, Phone, MapPin } from 'lucide-react';
import PatientCertificates from '@/components/PatientCertificates';
import { Badge } from '@/components/ui/badge';

const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const { data: patientData, isLoading, isError } = useQuery({
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

  const renderDemographicInfo = (patient: PatientInfo) => {
    if (!patient) return null;
    
    return (
      <div className="space-y-4">
        {patient.citizenship && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Citizenship:</span>
            <Badge variant="outline">
              {patient.citizenship === 'citizen' ? 'South African Citizen' : 
               patient.citizenship === 'permanent_resident' ? 'Permanent Resident' : 
               patient.citizenship}
            </Badge>
          </div>
        )}
        
        {patient.age_at_registration !== null && patient.age_at_registration !== undefined && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Age at Registration:</span>
            <span>{patient.age_at_registration} years</span>
          </div>
        )}
        
        {patient.id_number_validated && (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              ID Validated
            </Badge>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button variant="outline" onClick={() => navigate('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patient List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {patientData?.first_name} {patientData?.last_name}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Patient Information</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(`/patients/${id}/edit`)}
                title="Edit patient"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p>Loading patient information...</p>
              ) : isError ? (
                <p>Error loading patient information</p>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{patientData?.gender || 'Unknown gender'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {patientData?.date_of_birth 
                            ? format(new Date(patientData?.date_of_birth), 'PPP')
                            : 'No birth date'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      {patientData?.contact_info?.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{patientData.contact_info.email}</span>
                        </div>
                      )}
                      {patientData?.contact_info?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{patientData.contact_info.phone}</span>
                        </div>
                      )}
                      {patientData?.contact_info?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{patientData.contact_info.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Demographic Information</h3>
                    {renderDemographicInfo(patientData!)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {patientData?.contact_info?.company && (
            <Card>
              <CardHeader>
                <CardTitle>Employment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Company</span>
                    <p>{patientData.contact_info.company}</p>
                  </div>
                  {patientData.contact_info.occupation && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Occupation</span>
                      <p>{patientData.contact_info.occupation}</p>
                    </div>
                  )}
                  {patientData.contact_info.employee_id && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Employee ID</span>
                      <p>{patientData.contact_info.employee_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="certificates">
            <TabsList className="mb-4">
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="medical-history">Medical History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="certificates">
              {patientData && (
                <PatientCertificates patientId={id!} organizationId={organizationId!} />
              )}
            </TabsContent>
            
            <TabsContent value="visits">
              {patientData && (
                <PatientVisits patientId={id!} />
              )}
            </TabsContent>
            
            <TabsContent value="medical-history">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  {patientData.medical_history ? (
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Medical Conditions</dt>
                        <dd className="text-base mt-1">
                          {patientData.medical_history.conditions && patientData.medical_history.conditions.length > 0 ? (
                            <ul className="list-disc pl-4">
                              {patientData.medical_history.conditions.map((condition, index) => (
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
                          {patientData.medical_history.medications && patientData.medical_history.medications.length > 0 ? (
                            <ul className="list-disc pl-4">
                              {patientData.medical_history.medications.map((med, index) => (
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
                          {patientData.medical_history.allergies && patientData.medical_history.allergies.length > 0 ? (
                            <ul className="list-disc pl-4">
                              {patientData.medical_history.allergies.map((allergy, index) => (
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
                        onClick={() => navigate(`/patients/${id}/edit`)}
                      >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Add Medical History
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;
