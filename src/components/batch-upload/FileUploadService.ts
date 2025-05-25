
import { supabase } from "@/integrations/supabase/client";
import { QueuedFile, FileStatus } from "./types";

export class FileUploadService {
  static async uploadFile(
    fileItem: QueuedFile, 
    index: number,
    updateFileProgress: (index: number, progress: number) => void,
    updateFileStatus: (index: number, status: FileStatus, documentId?: string, error?: string) => void,
    patientId?: string,
    organizationId?: string,
    clientOrganizationId?: string
  ) {
    updateFileStatus(index, 'uploading');
    updateFileProgress(index, 10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const formData = new FormData();
      formData.append('file', fileItem.file);
      formData.append('documentType', fileItem.documentType);
      formData.append('userId', user.id);

      if (patientId) formData.append('patientId', patientId);
      if (organizationId) formData.append('organizationId', organizationId);
      if (clientOrganizationId) formData.append('clientOrganizationId', clientOrganizationId);
    
      console.log("Uploading document with params:", {
        documentType: fileItem.documentType,
        patientId: patientId || "null",
        organizationId: organizationId || "null",
        clientOrganizationId: clientOrganizationId || "null"
      });

      const progressInterval = setInterval(() => {
        updateFileProgress(index, Math.min(
          (fileItem.progress || 0) + Math.random() * 5, 
          60)
        );
      }, 500);

      try {
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: formData,
        });

        clearInterval(progressInterval);
        
        if (error) throw error;
        
        updateFileProgress(index, 80);
        updateFileStatus(index, 'processing', data?.documentId);
        
        if (!data?.documentId) {
          throw new Error("No document ID returned from processing function");
        }
        
        const updateData: any = {
          organization_id: organizationId,
          client_organization_id: clientOrganizationId || null
        };
        
        if (patientId) {
          updateData.owner_id = patientId;
          console.log(`Linking document ${data.documentId} to patient ${patientId}`);
        }
        
        const { error: updateError } = await supabase
          .from('documents')
          .update(updateData)
          .eq('id', data.documentId);
          
        if (updateError) {
          throw updateError;
        }
        
        updateFileProgress(index, 100);
        updateFileStatus(index, 'complete', data.documentId);
        
        return data;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    } catch (error: any) {
      console.error("Error uploading document:", error);
      updateFileStatus(index, 'error', undefined, error.message || "Upload failed");
      throw error;
    }
  }
}
