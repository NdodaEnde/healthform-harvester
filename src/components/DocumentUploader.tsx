
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { willRequireSDKProcessing } from "@/utils/documentOrganizationFixer";

const DOCUMENT_TYPES = [
  { label: "Certificate of Fitness", value: "certificate-fitness" },
  { label: "Medical Questionnaire", value: "medical-questionnaire" },
  { label: "Medical Report", value: "medical-report" },
  { label: "Audiogram", value: "audiogram" },
  { label: "Spirometry", value: "spirometry" },
  { label: "X-Ray Report", value: "xray-report" },
  { label: "Other", value: "other" }
];

export interface DocumentUploaderProps {
  onUploadComplete?: (data?: any) => void;
  organizationId?: string;
  clientOrganizationId?: string;
}

const DocumentUploader = ({ 
  onUploadComplete,
  organizationId,
  clientOrganizationId 
}: DocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("certificate-fitness");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [needsSDKProcessing, setNeedsSDKProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Check if this file will require SDK processing
      setNeedsSDKProcessing(willRequireSDKProcessing(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    if (!organizationId) {
      toast({
        title: "No organization context",
        description: "Please select an organization before uploading",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Get current user for folder path organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Create a formData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('userId', user.id);

      // Adjust progress simulation based on expected processing time
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Slower progress for large documents that need SDK processing
          if (needsSDKProcessing) {
            if (prev < 40) return prev + 2;
            if (prev < 60) return prev + 1;
            return prev;
          } else {
            // Regular progress for standard documents
            if (prev < 60) return prev + 5;
            return prev;
          }
        });
      }, needsSDKProcessing ? 500 : 300);

      // Call the Supabase Edge Function to process the document
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (error) throw error;
      
      setUploadProgress(80);
      
      // First verify if the document has been properly created
      if (!data?.documentId) {
        throw new Error("No document ID returned from processing function");
      }
      
      // Update the document record with organization context
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          organization_id: organizationId,
          client_organization_id: clientOrganizationId || null
        })
        .eq('id', data.documentId);
        
      if (updateError) {
        throw updateError;
      }
      
      setUploadProgress(100);
      
      toast({
        title: "Upload successful",
        description: needsSDKProcessing 
          ? "Your document has been uploaded and is being processed using advanced processing. This may take longer for large documents."
          : "Your document has been uploaded and is being processed",
      });
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }
      
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setFile(null);
      setUploadProgress(0);
      setNeedsSDKProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document-type">Document Type</Label>
        <Select 
          value={documentType} 
          onValueChange={setDocumentType}
          disabled={uploading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="file">Upload Document</Label>
        <Input 
          id="file" 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX, TXT
        </p>
      </div>

      {needsSDKProcessing && file && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Large document detected</p>
            <p>This document may require advanced processing which could take longer than usual.</p>
          </div>
        </div>
      )}

      {organizationId && (
        <div className="text-xs text-muted-foreground">
          {clientOrganizationId ? (
            <p>This document will be uploaded for client organization</p>
          ) : (
            <p>This document will be uploaded to your organization</p>
          )}
        </div>
      )}
      
      {uploading && (
        <div className="space-y-2">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {uploadProgress < 40 ? "Uploading..." : uploadProgress < 80 ? "Processing..." : "Finalizing..."}
            {needsSDKProcessing && uploadProgress >= 40 && uploadProgress < 80 && " (Advanced document processing)"}
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading} 
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Uploading{needsSDKProcessing ? " (Advanced Processing)" : ""}...</span>
          </>
        ) : (
          <span>Upload Document</span>
        )}
      </Button>
    </div>
  );
};

export default DocumentUploader;
