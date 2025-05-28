
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import PatientCertificates from '@/components/PatientCertificates';
import PatientVisits from '@/components/PatientVisits';
import PatientDetailHeader from '@/components/patients/PatientDetailHeader';
import PatientInfoCard from '@/components/patients/PatientInfoCard';
import DocumentUploadDialog from '@/components/patients/DocumentUploadDialog';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { DatabasePatient } from '@/types/database';

const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
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
      <PatientDetailHeader 
        patientId={patientId}
        onUploadClick={handleUploadClick}
      />

      {patient && (
        <div className="space-y-6">
          <PatientInfoCard 
            patient={patient} 
            organizationName={patientOrganization?.name}
          />
          
          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visits" className="space-y-6">
              <PatientVisits 
                patientId={patient.id} 
                organizationId={patient.organization_id || ''} 
              />
            </TabsContent>
            
            <TabsContent value="certificates">
              {currentOrganization && (
                <PatientCertificates 
                  patientId={patient.id} 
                  organizationId={currentOrganization.id} 
                />
              )}
            </TabsContent>
          </Tabs>

          <DocumentUploadDialog
            isOpen={showUploadDialog}
            onClose={() => setShowUploadDialog(false)}
            patient={patient}
            organizationId={currentOrganization?.id}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}
    </div>
  );
};

export default PatientDetailPage;
