import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";

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
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
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
      setProcessingStatus("Preparing upload...");
      setDocumentStatus(null);

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

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 40) {
            setProcessingStatus("Uploading file...");
            return prev + 5;
          } else if (prev < 70) {
            setProcessingStatus("Processing document...");
            return prev + 2;
          } else if (prev < 90) {
            setProcessingStatus("Extracting data...");
            return prev + 1;
          }
          return prev;
        });
      }, 300);

      // Call the Supabase Edge Function to process the document
      setProcessingStatus("Sending to processing service...");
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (error) throw error;
      
      setUploadProgress(90);
      setProcessingStatus("Finalizing...");
      setDocumentStatus(data?.status || "unknown");
      
      console.log("Document processing response:", data);
      
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
      
      // Verify the document status after updating
      const { data: verifyData, error: verifyError } = await supabase
        .from('documents')
        .select('status, extracted_data')
        .eq('id', data.documentId)
        .single();
        
      if (verifyError) {
        console.error("Error verifying document status:", verifyError);
      } else {
        console.log("Final document status:", verifyData.status);
        console.log("Extracted data present:", !!verifyData.extracted_data);
        
        // Update UI with verified status
        setDocumentStatus(verifyData.status);
        
        const hasStructuredData = verifyData.extracted_data?.structured_data && 
          Object.keys(verifyData.extracted_data.structured_data).length > 0;
        
        const hasRawContent = verifyData.extracted_data?.raw_content && 
          verifyData.extracted_data.raw_content.length > 0;
          
        if (hasStructuredData) {
          setProcessingStatus("Document processed completely with structured data!");
        } else if (hasRawContent) {
          setProcessingStatus("Document uploaded with raw text but no structured data");
        } else {
          setProcessingStatus("Document uploaded but no text could be extracted");
        }
      }
      
      let toastMessage = "";
      let toastVariant: "default" | "destructive" = "default";
      
      switch (verifyData?.status || data?.status) {
        case "processed":
          toastMessage = "Your document has been uploaded and fully processed";
          break;
        case "extracted":
          toastMessage = "Your document has been uploaded but only raw text was extracted";
          toastVariant = "destructive";
          break;
        case "failed":
          toastMessage = "Your document was uploaded but data extraction failed";
          toastVariant = "destructive";
          break;
        default:
          toastMessage = "Your document has been uploaded";
      }
      
      toast({
        title: "Upload complete",
        description: toastMessage,
        variant: toastVariant
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
      setDocumentStatus("failed");
      setProcessingStatus("Upload failed: " + (error.message || "Unknown error"));
    } finally {
      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setUploadProgress(0);
        // Keep the status message visible
      }, 2000); // Keep success/failure message visible for 2 seconds
    }
  };

  const getStatusDisplay = () => {
    if (!documentStatus) return null;
    
    switch (documentStatus) {
      case "processed":
        return (
          <div className="flex items-center text-sm text-green-600 mt-2">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Document processed successfully with structured data!</span>
          </div>
        );
      case "extracted":
        return (
          <div className="flex items-center text-sm text-amber-600 mt-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Document text extracted but no structured data available</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center text-sm text-red-600 mt-2">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span>Document processing failed - no data could be extracted</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <Info className="h-4 w-4 mr-1" />
            <span>Document status: {documentStatus}</span>
          </div>
        );
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {processingStatus || "Processing..."}
            </p>
            <p className="text-xs font-medium">{uploadProgress}%</p>
          </div>
          {uploadProgress === 100 && getStatusDisplay()}
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
            <span>Uploading...</span>
          </>
        ) : (
          <span>Upload Document</span>
        )}
      </Button>
    </div>
  );
};

export default DocumentUploader;
