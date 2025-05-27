
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Calendar, User, Phone, Mail, FileText, MapPin, Globe, Shield, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import PatientCertificates from '@/components/PatientCertificates';
import PatientVisits from '@/components/PatientVisits';
import PatientHeader from '@/components/patients/PatientHeader';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { DatabasePatient } from '@/types/database';

interface PatientDetailPageProps {
  patientId?: string;
}

const PatientDetailPage: React.FC<PatientDetailPageProps> = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<DatabasePatient>>({});

  // Fetch patient data
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("Patient ID is required");
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as DatabasePatient;
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patient) {
      setEditedPatient(patient);
    }
  }, [patient]);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (updates: Partial<DatabasePatient>) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Patient updated",
        description: "Patient details have been successfully updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedPatient(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedPatient(prev => {
      const contactInfo = { ...prev.contact_info, [name]: value };
      return { ...prev, contact_info: contactInfo };
    });
  };

  const handleSave = async () => {
    if (!patientId) return;
    await updatePatientMutation.mutateAsync(editedPatient);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (patient) {
      setEditedPatient(patient);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading patient data...</div>;
  }

  if (isError) {
    return <div className="text-center">Error: {error?.message}</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      {patient && (
        <div className="space-y-6">
          <PatientHeader patient={patient} />
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Patient Details</CardTitle>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave} disabled={updatePatientMutation.isPending}>
                          {updatePatientMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={updatePatientMutation.isPending}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={(editedPatient.first_name || '') as string}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={(editedPatient.last_name || '') as string}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={(editedPatient.date_of_birth || '') as string}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">ID Number</label>
                      <input
                        type="text"
                        name="id_number"
                        value={(editedPatient.id_number || '') as string}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={((editedPatient.contact_info as any)?.phone || '') as string}
                        onChange={handleContactInfoChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={((editedPatient.contact_info as any)?.email || '') as string}
                        onChange={handleContactInfoChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="visits" className="space-y-6">
              {patient && (
                <PatientVisits 
                  patientId={patient.id} 
                  organizationId={patient.organization_id || ''} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="certificates">
              {patient && currentOrganization && (
                <PatientCertificates patientId={patient.id} organizationId={currentOrganization.id} />
              )}
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        This section is under development. Security features will be added soon.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
