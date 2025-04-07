import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import MedicalHistoryEditor from '@/components/MedicalHistoryEditor';
import { MedicalHistoryData, ContactInfo } from '@/types/patient';

interface PatientFormState {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  contact_info: ContactInfo;
  citizenship?: string | null;
  age_at_registration?: number | null;
  id_number_validated?: boolean;
}

const PatientEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  const [formState, setFormState] = useState<PatientFormState>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    contact_info: {
      email: '',
      phone: ''
    },
    citizenship: null,
    age_at_registration: null,
    id_number_validated: false
  });

  const [activeTab, setActiveTab] = useState('personal');

  const { isLoading, isError } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const contactInfo: ContactInfo = 
        (data.contact_info && typeof data.contact_info === 'object') 
          ? data.contact_info as ContactInfo 
          : { email: '', phone: '' };
      
      setFormState({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
        gender: data.gender || '',
        contact_info: {
          email: contactInfo.email || '',
          phone: contactInfo.phone || '',
        },
        citizenship: data.citizenship || null,
        age_at_registration: data.age_at_registration || null,
        id_number_validated: data.id_number_validated || false
      });
      
      return data;
    },
    enabled: !!id,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (patientData: PatientFormState) => {
      const { error } = await supabase
        .from('patients')
        .update({
          first_name: patientData.first_name,
          last_name: patientData.last_name,
          date_of_birth: patientData.date_of_birth,
          gender: patientData.gender,
          contact_info: patientData.contact_info,
          citizenship: patientData.citizenship,
          age_at_registration: patientData.age_at_registration,
          id_number_validated: patientData.id_number_validated,
          organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Patient updated",
        description: "The patient information has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      navigate(`/patients/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const { mutate: updateMedicalHistory, isPending: isSavingMedicalHistory } = useMutation({
    mutationFn: async (medicalHistoryData: MedicalHistoryData) => {
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('medical_history')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      let currentMedicalHistory: MedicalHistoryData = {};
      if (currentPatient?.medical_history) {
        if (typeof currentPatient.medical_history === 'object') {
          currentMedicalHistory = currentPatient.medical_history as MedicalHistoryData;
        } else if (typeof currentPatient.medical_history === 'string') {
          try {
            currentMedicalHistory = JSON.parse(currentPatient.medical_history);
          } catch (e) {
            console.error("Failed to parse medical_history", e);
          }
        }
      }
      
      const documents = currentMedicalHistory?.documents || [];
      const updatedMedicalHistory = {
        ...medicalHistoryData,
        documents
      };
      
      const { error } = await supabase
        .from('patients')
        .update({
          medical_history: updatedMedicalHistory as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Medical history updated",
        description: "The patient's medical history has been successfully updated."
      });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update medical history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleSaveMedicalHistory = async (data: MedicalHistoryData): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      updateMedicalHistory(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contact_info.')) {
      const field = name.split('.')[1];
      setFormState(prev => ({
        ...prev,
        contact_info: {
          ...prev.contact_info,
          [field]: value
        }
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGenderChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      gender: value
    }));
  };

  const handleCitizenshipChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      citizenship: value
    }));
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value !== '' ? parseInt(e.target.value, 10) : null;
    setFormState(prev => ({
      ...prev,
      age_at_registration: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formState);
  };

  const handleCancel = () => {
    navigate(`/patients/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Error Loading Patient</h2>
        <p className="text-muted-foreground mb-4">There was an error loading the patient information.</p>
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
        <Button variant="ghost" size="icon" onClick={() => navigate(`/patients/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Patient</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formState.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formState.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formState.date_of_birth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formState.gender} onValueChange={handleGenderChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="contact_info.email"
                      type="email"
                      value={formState.contact_info.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="contact_info.phone"
                      type="tel"
                      value={formState.contact_info.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <MedicalHistoryEditor
            patientId={id!}
            initialData={queryClient.getQueryData<any>(['patient', id])?.medical_history || {}}
            onSave={handleSaveMedicalHistory}
          />
        </TabsContent>

        <TabsContent value="demographics" className="mt-4">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Demographic Information</CardTitle>
                <CardDescription>
                  Used for analytics and reporting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="citizenship">Citizenship Status</Label>
                    <Select value={formState.citizenship || ''} onValueChange={handleCitizenshipChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select citizenship status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">South African Citizen</SelectItem>
                        <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age at Registration</Label>
                    <Input
                      id="age"
                      name="age_at_registration"
                      type="number"
                      value={formState.age_at_registration?.toString() || ''}
                      onChange={handleAgeChange}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {formState.id_number_validated && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      ID Validated
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientEditPage;
