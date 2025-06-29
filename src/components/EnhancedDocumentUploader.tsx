
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase, safeQueryResult } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle, AlertTriangle, Info, Zap } from "lucide-react";
import { createStandardizedFilePath } from "@/utils/documentOrganizationFixer";
import { useStructuredExtractionV2, useStructuredExtractionRollout } from "@/hooks/useStructuredExtractionV2";

const DOCUMENT_TYPES = [
  { label: "Certificate of Fitness", value: "certificate-fitness" },
  { label: "Medical Questionnaire", value: "medical-questionnaire" },
  { label: "Medical Report", value: "medical-report" },
  { label: "Audiogram", value: "audiogram" },
  { label: "Spirometry", value: "spirometry" },
  { label: "X-Ray Report", value: "xray-report" },
  { label: "Other", value: "other" }
];

export interface EnhancedDocumentUploaderProps {
  onUploadComplete?: (data?: any) => void;
  organizationId?: string;
  clientOrganizationId?: string;
  patientId?: string;
  allowMethodSelection?: boolean;
}

const EnhancedDocumentUploader = ({ 
  onUploadComplete,
  organizationId,
  clientOrganizationId,
  patientId,
  allowMethodSelection = false
}: EnhancedDocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("certificate-fitness");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  const [forceMethod, setForceMethod] = useState<'auto' | 'v1' | 'v2'>('auto');

  const { shouldUseV2: featureFlagV2 } = useStructuredExtractionV2();
  const { shouldUseV2: rolloutV2, rolloutPercentage, userPercentage } = useStructuredExtractionRollout();

  const shouldUseV2 = forceMethod === 'v2' || 
                      (forceMethod === 'auto' && (featureFlagV2 || rolloutV2));

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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const standardizedPath = createStandardizedFilePath(
        organizationId,
        documentType,
        patientId,
        file.name
      );

      console.log("Using standardized file path:", standardizedPath);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('userId', user.id);
      formData.append('filePath', standardizedPath);
      
      if (patientId) formData.append('patientId', patientId);
      if (organizationId) formData.append('organizationId', organizationId);
      if (clientOrganizationId) formData.append('clientOrganizationId', clientOrganizationId);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 40) {
            setProcessingStatus("Uploading file...");
            return prev + 5;
          } else if (prev < 70) {
            setProcessingStatus(shouldUseV2 ? "Processing with AI extraction..." : "Processing document...");
            return prev + 2;
          } else if (prev < 90) {
            setProcessingStatus("Extracting data...");
            return prev + 1;
          }
          return prev;
        });
      }, 300);

      const edgeFunction = shouldUseV2 ? 'process-document-v2' : 'process-document';
      const methodLabel = shouldUseV2 ? 'Structured Extraction V2' : 'Legacy Extraction V1';
      
      setProcessingStatus(`Processing with ${methodLabel}...`);
      
      console.log(`Using ${edgeFunction} for processing`);
      
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (error) throw error;
      
      if (!data?.documentId) {
        throw new Error("No document ID returned from processing function");
      }
      
      setUploadProgress(90);
      setProcessingStatus("Finalizing...");
      setDocumentStatus(data?.document?.status || data?.status || "unknown");
      
      console.log("Document processing response:", data);

      // Update document with organization and patient context
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
        console.error("Error updating document with patient link:", updateError);
        throw updateError;
      }
      
      setUploadProgress(100);
      
      // Verify document status
      const { data: verifyData, error: verifyError } = await supabase
        .from('documents')
        .select('status, extracted_data, public_url, file_path, owner_id, processing_metadata')
        .eq('id', data.documentId)
        .single();
        
      if (verifyError) {
        console.error("Error verifying document status:", verifyError);
      } else {
        const typedVerifyData = safeQueryResult<{
          status: string;
          extracted_data: any;
          public_url: string;
          file_path: string;
          owner_id: string | null;
          processing_metadata: any;
        }>(verifyData);

        console.log("Final document status:", typedVerifyData.status);
        console.log("Processing method:", typedVerifyData.processing_metadata?.extraction_method || 'unknown');
        console.log("Confidence score:", typedVerifyData.processing_metadata?.confidence_score || 'N/A');
        
        setDocumentStatus(typedVerifyData.status);
        
        const confidence = typedVerifyData.processing_metadata?.confidence_score || 0;
        const extractionMethod = typedVerifyData.processing_metadata?.extraction_method || 'legacy';
        
        if (confidence > 0.8) {
          setProcessingStatus(`Document processed successfully with ${extractionMethod}! (${(confidence * 100).toFixed(1)}% confidence)`);
        } else if (confidence > 0.5) {
          setProcessingStatus(`Document processed with ${extractionMethod} (${(confidence * 100).toFixed(1)}% confidence - may need review)`);
        } else {
          setProcessingStatus(`Document uploaded but extraction quality is low (${(confidence * 100).toFixed(1)}% confidence)`);
        }
      }
      
      let toastMessage = "";
      let toastVariant: "default" | "destructive" = "default";
      
      const docStatus = verifyData ? safeQueryResult<{status: string}>(verifyData).status : (data?.status || "unknown");
      
      if (patientId) {
        toastMessage = `Document uploaded and linked to patient (${methodLabel})`;
      } else {
        switch (docStatus) {
          case "processed":
            toastMessage = `Document processed successfully with ${methodLabel}`;
            break;
          case "extracted":
            toastMessage = `Document uploaded with ${methodLabel} - partial extraction`;
            toastVariant = "destructive";
            break;
          case "failed":
            toastMessage = `Document upload failed with ${methodLabel}`;
            toastVariant = "destructive";
            break;
          default:
            toastMessage = `Document uploaded with ${methodLabel}`;
        }
      }
      
      toast({
        title: "Upload complete",
        description: toastMessage,
        variant: toastVariant
      });
      
      if (onUploadComplete) {
        onUploadComplete({
          ...data,
          extractionMethod: shouldUseV2 ? 'v2' : 'v1',
          methodUsed: methodLabel
        });
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
      }, 2000);
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
      {/* Processing Method Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Processing Method: {shouldUseV2 ? 'AI Structured Extraction V2' : 'Legacy Extraction V1'}
          </span>
          {shouldUseV2 && <Badge variant="default">New</Badge>}
        </div>
        {rolloutV2 && (
          <p className="text-xs text-blue-700">
            You're in the {rolloutPercentage}% rollout group (ID: {userPercentage})
          </p>
        )}
      </div>

      {/* Method Selection (if allowed) */}
      {allowMethodSelection && (
        <div className="space-y-2">
          <Label htmlFor="processing-method">Processing Method (Testing)</Label>
          <Select value={forceMethod} onValueChange={(value: 'auto' | 'v1' | 'v2') => setForceMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Feature Flag Controlled)</SelectItem>
              <SelectItem value="v1">Force V1 (Legacy Extraction)</SelectItem>
              <SelectItem value="v2">Force V2 (Structured Extraction)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

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
          <p>
            This document will be uploaded to the standardized folder structure in the medical-documents bucket.
          </p>
          {patientId && (
            <p className="mt-1 text-green-600">Document will be linked to the current patient.</p>
          )}
          {clientOrganizationId && (
            <p className="mt-1">Document will be associated with client organization.</p>
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
            <span>Uploading with {shouldUseV2 ? 'V2' : 'V1'}...</span>
          </>
        ) : (
          <span>Upload Document ({shouldUseV2 ? 'V2 Processing' : 'V1 Processing'})</span>
        )}
      </Button>
    </div>
  );
};

export default EnhancedDocumentUploader;
