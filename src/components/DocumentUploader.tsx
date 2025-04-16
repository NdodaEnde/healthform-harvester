import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, FileText } from "lucide-react";
import { willRequireSDKProcessing } from "@/utils/documentOrganizationFixer";
import { useDocumentProcessing } from "@/hooks/useDocumentProcessing";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
  enableAIQuery?: boolean;
}

const DocumentUploader = ({ 
  onUploadComplete,
  organizationId,
  clientOrganizationId,
  enableAIQuery = false
}: DocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("certificate-fitness");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [needsSDKProcessing, setNeedsSDKProcessing] = useState(false);
  const [aiQuery, setAIQuery] = useState("");
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [processingAttempts, setProcessingAttempts] = useState(0);
  
  const { processDocument, isProcessing, processingProgress, data: processedData } = useDocumentProcessing();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const requiresSDK = willRequireSDKProcessing(selectedFile);
      setNeedsSDKProcessing(requiresSDK);
      
      setProcessingAttempts(0);
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
    
    setProcessingAttempts(prev => prev + 1);
    
    if (processingAttempts >= 3) {
      toast({
        title: "Multiple processing attempts",
        description: "We've tried processing this file multiple times. Try using a smaller or different file format.",
        variant: "default"
      });
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      setIsLocalProcessing(true);

      try {
        console.log(`Starting document processing (attempt ${processingAttempts + 1})`);
        console.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);
        console.log(`AI Query: ${aiQuery || "None"}`);
        
        await processDocument(file, aiQuery.length > 0 ? aiQuery : undefined);
        
        setUploadProgress(100);
        
        toast({
          title: "Document processed successfully",
          description: "Your document has been analyzed using the document processing pipeline.",
        });
        
        if (onUploadComplete) {
          onUploadComplete(processedData);
        }
      } catch (error) {
        console.error("Error processing document:", error);
        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : "Failed to process document",
          variant: "destructive"
        });
      } finally {
        setIsLocalProcessing(false);
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
      setAIQuery("");
    }
  };

  const getProgressPercentage = () => {
    if (isLocalProcessing && processingProgress) {
      return processingProgress;
    }
    return uploadProgress;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="document-type">Document Type</Label>
        <Select 
          value={documentType} 
          onValueChange={setDocumentType}
          disabled={uploading || isProcessing}
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
          disabled={uploading || isProcessing}
        />
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX, TXT
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 truncate">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {enableAIQuery && file && (
        <div className="space-y-2">
          <Label htmlFor="aiQuery">Ask AI about this document (optional)</Label>
          <Textarea
            id="aiQuery"
            placeholder="e.g., What are the key recommendations in this report?"
            value={aiQuery}
            onChange={(e) => setAIQuery(e.target.value)}
            disabled={uploading || isProcessing}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Ask a question about this document to get AI-powered analysis
          </p>
        </div>
      )}

      {file && file.size > 5 * 1024 * 1024 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Large file detected</p>
            <p>This document is larger than 5MB and may take longer to process. Consider using a smaller file if processing fails.</p>
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
      
      {(uploading || isProcessing) && (
        <div className="space-y-2">
          <Progress value={getProgressPercentage()} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {getProgressPercentage() < 40 ? "Uploading..." : 
             getProgressPercentage() < 80 ? "Processing..." : "Finalizing..."}
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading || isProcessing} 
        className="w-full"
      >
        {uploading || isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Processing... ({getProgressPercentage()}%)</span>
          </>
        ) : (
          <span>Process Document</span>
        )}
      </Button>
    </div>
  );
};

export default DocumentUploader;
