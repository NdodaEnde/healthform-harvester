
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, X, Loader2, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DocumentUploaderProps = {
  onUploadComplete: (data?: any) => void;
};

const DocumentUploader = ({ onUploadComplete }: DocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("medical-questionnaire");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Effect to check document processing status
  useEffect(() => {
    if (!processingDocumentId) return;

    const checkStatus = async () => {
      try {
        // Use maybeSingle instead of single to handle the case where no rows are returned
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', processingDocumentId)
          .maybeSingle();

        if (error) {
          console.error('Error checking document status:', error);
          return;
        }

        // If no data found, the document might not exist yet or was deleted
        if (!data) {
          console.log('Document not found, it might still be processing');
          return;
        }

        if (data.status === 'processed') {
          // Document processing completed successfully
          clearInterval(progressIntervalRef.current!);
          setUploadProgress(100);
          
          // Prepare document data for the parent component
          const processedData = {
            id: data.id,
            name: data.file_name,
            type: documentType === "medical-questionnaire" 
              ? "Medical Examination Questionnaire" 
              : "Certificate of Fitness",
            uploadedAt: data.created_at,
            status: "processed",
            patientName: extractPatientName(data.extracted_data),
            patientId: extractPatientId(data.extracted_data),
            imageUrl: await getFileUrl(data.file_path),
            extractedData: data.extracted_data,
            jsonData: JSON.stringify(data.extracted_data, null, 2)
          };
          
          // Delay completion to show 100% progress
          setTimeout(() => {
            setIsUploading(false);
            onUploadComplete(processedData);
            setProcessingDocumentId(null);
            
            toast({
              title: "Document processed successfully",
              description: "Your document has been processed using AI extraction."
            });
          }, 500);
        } else if (data.status === 'failed') {
          // Document processing failed
          clearInterval(progressIntervalRef.current!);
          setIsUploading(false);
          setProcessingDocumentId(null);
          
          // Check for specific error message about API key
          const errorMessage = data.processing_error || 'There was an error processing your document.';
          const isApiKeyError = errorMessage.includes('API key is not configured');
          
          if (isApiKeyError) {
            toast({
              variant: "destructive",
              title: "API Configuration Required",
              description: "The Landing AI API key is not configured. Please set up the API key in the Supabase secrets."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Document processing failed",
              description: errorMessage
            });
          }
        }
        // If still processing, continue checking
      } catch (error) {
        console.error('Error in status check:', error);
      }
    };

    // Check status every 2 seconds
    const interval = setInterval(checkStatus, 2000);
    progressIntervalRef.current = interval as unknown as number;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [processingDocumentId, documentType]);

  // Helper function to get file URL from Supabase storage
  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase
      .storage
      .from('medical-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
      
    return data?.signedUrl || null;
  };

  // Helper functions to extract patient info from extracted data
  const extractPatientName = (extractedData: any) => {
    if (!extractedData) return "Unknown";
    
    if (extractedData.structured_data && extractedData.structured_data.patient) {
      return extractedData.structured_data.patient.name || "Unknown";
    }
    
    return "Unknown";
  };
  
  const extractPatientId = (extractedData: any) => {
    if (!extractedData) return "No ID";
    
    if (extractedData.structured_data && extractedData.structured_data.patient) {
      return extractedData.structured_data.patient.employee_id || 
             extractedData.structured_data.patient.id || 
             "No ID";
    }
    
    return "No ID";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check if file is valid (PDF, PNG, or JPEG)
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    // Check file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 50MB."
      });
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    
    // Check if file is valid (PDF, PNG, or JPEG)
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(droppedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    // Check file size (max 50MB)
    if (droppedFile.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 50MB."
      });
      return;
    }
    
    setFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Create a simulated progress indicator
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Hold at 90% until API response
        }
        return prev + 5;
      });
    }, 300);

    try {
      // Create FormData for the edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      // Use the constant values from the client.ts file
      const SUPABASE_URL = "https://wgkbsiczgyaqmgoyirjs.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2JzaWN6Z3lhcW1nb3lpcmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODQ3NjcsImV4cCI6MjA1NTk2MDc2N30.WVI1UFFrL5A0_jYt-j7BDZJtzqHqnb5PXHZSGKr6qxE";
      
      // Call the edge function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-document`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Edge Function Response:", data);
      
      // Store document ID for status polling
      setProcessingDocumentId(data.documentId);
      
      // Clear the progress interval from earlier
      clearInterval(progressInterval);
      
      // Add a timeout to stop checking for status after 30 seconds
      setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
          
          // If we're still in uploading state, something went wrong
          if (isUploading) {
            setIsUploading(false);
            setUploadProgress(0);
            
            toast({
              variant: "destructive",
              title: "Processing timeout",
              description: "Document processing took too long. The document might still be processing in the background."
            });
          }
        }
      }, 30000); // 30 seconds timeout
      
      // Set progress to indicate processing stage
      setUploadProgress(95);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: 'There was an error processing your document. Please try again.'
      });
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Document Type</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of document you're uploading
        </p>
        <RadioGroup
          value={documentType}
          onValueChange={setDocumentType}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medical-questionnaire" id="medical-questionnaire" />
            <Label htmlFor="medical-questionnaire" className="cursor-pointer">
              Medical Examination Questionnaire
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="certificate-fitness" id="certificate-fitness" />
            <Label htmlFor="certificate-fitness" className="cursor-pointer">
              Certificate of Fitness
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Upload Document</h3>
        <p className="text-sm text-muted-foreground">
          Supported formats: PDF, PNG, JPEG (max 50MB, up to 5 pages for PDF)
        </p>
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              key="dropzone"
              className="border-2 border-dashed rounded-lg p-8 mt-3 text-center hover:bg-secondary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-3 rounded-full bg-secondary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your document will be securely processed with AI extraction
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              key="file-preview"
              className="border rounded-lg p-4 mt-3"
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploadProgress >= 95 ? "Processing document with AI..." : "Uploading..."}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={removeFile}
                      disabled={uploadProgress > 0}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-secondary/80 rounded">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          variant="outline" 
          onClick={() => onUploadComplete()}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="min-w-[120px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploadProgress >= 95 ? "Processing..." : "Uploading..."}
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4 mr-2" />
              Process with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;
