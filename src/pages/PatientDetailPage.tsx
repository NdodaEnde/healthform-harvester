
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
import { ArrowLeft, Edit, Upload, User, IdCard, Building } from 'lucide-react';
import PatientCertificates from '@/components/PatientCertificates';
import PatientVisits from '@/components/PatientVisits';
import PatientHeader from '@/components/patients/PatientHeader';
import DocumentUploader from '@/components/DocumentUploader';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { DatabasePatient } from '@/types/database';

interface PatientDetailPageProps {
  patientId?: string;
}

const PatientDetailPage: React.FC<PatientDetailPageProps> = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentOrganization, currentClient } = useOrganization();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Early return if no patientId
  if (!patientId) {
    return <div className="text-center">Invalid patient ID</div>;
  }

  // Fetch patient data
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
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

  // Fetch organization name for the patient
  const { data: patientOrganization } = useQuery({
    queryKey: ['organization', patient?.client_organization_id],
    queryFn: async () => {
      if (!patient?.client_organization_id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', patient.client_organization_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!patient?.client_organization_id,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<DatabasePatient>>({});

  const handleUploadComplete = () => {
    setShowUploadDialog(false);
    toast({
      title: "Document uploaded",
      description: "Document has been successfully uploaded for this patient.",
    });
    // Refresh any document-related queries if needed
    queryClient.invalidateQueries({ queryKey: ['documents', patientId] });
  };

  const handleUploadClick = () => {
    console.log('Upload button clicked');
    setShowUploadDialog(true);
  };

  if (isLoading) {
    return <div className="text-center">Loading patient data...</div>;
  }

  if (isError) {
    return <div className="text-center">Error: {error?.message}</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/patients/${patientId}/edit`)}
            className="hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Patient
          </Button>
          <Button 
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {patient && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Name:</span>
                      <span>{patient.first_name} {patient.last_name}</span>
                    </div>
                    {patient.id_number && (
                      <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">ID Number:</span>
                        <span>{patient.id_number}</span>
                      </div>
                    )}
                    {patient.date_of_birth && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Date of Birth:</span>
                        <span>{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Gender:</span>
                        <Badge variant="outline">{patient.gender}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Organization</h3>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Organization:</span>
                    <span>{patientOrganization?.name || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>
            
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
          </Tabs>

          {/* Upload Document Dialog */}
          {showUploadDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Upload Document for {patient.first_name} {patient.last_name}</h3>
                <DocumentUploader
                  onUploadComplete={handleUploadComplete}
                  organizationId={currentOrganization?.id}
                  clientOrganizationId={patient.client_organization_id}
                  patientId={patient.id}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadDialog(false)}
                  className="mt-4 w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
