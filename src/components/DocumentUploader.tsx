
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, X, Loader2, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
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
  const statusCheckIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const processingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!processingDocumentId) return;

    console.log(`Starting status check interval for document ID: ${processingDocumentId}`);
    processingStartTimeRef.current = Date.now();
    
    const checkStatus = async () => {
      try {
        console.log(`Checking status for document ID: ${processingDocumentId}`);
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', processingDocumentId)
          .maybeSingle();

        if (error) {
          console.error('Error checking document status:', error);
          return;
        }

        if (!data) {
          console.log('Document not found, it might still be processing');
          
          // Only show warning after 60 seconds instead of 30 seconds
          if (processingStartTimeRef.current && (Date.now() - processingStartTimeRef.current > 60000)) {
            console.log('Document not found after 60 seconds, checking again...');
            try {
              const secondCheck = await supabase
                .from('documents')
                .select('*')
                .eq('id', processingDocumentId)
                .maybeSingle();
                
              if (!secondCheck.data) {
                // We don't want to clear the status check yet; we'll let it continue
                // but inform the user that it's taking longer than expected
                toast.default({
                  title: "Processing taking longer than expected",
                  description: "The document is still being processed. This may take 3-4 minutes for larger files."
                });
              }
            } catch (err) {
              console.error('Error in second document check:', err);
            }
          }
          return;
        }

        console.log(`Document status: ${data.status}`);

        if (data.status === 'processed') {
          clearStatusCheckInterval();
          setUploadProgress(100);
          
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
          
          setTimeout(() => {
            setIsUploading(false);
            onUploadComplete(processedData);
            setProcessingDocumentId(null);
            processingStartTimeRef.current = null;
            
            toast.default({
              title: "Document processed successfully",
              description: "Your document has been processed using AI extraction."
            });
          }, 500);
        } else if (data.status === 'failed') {
          clearStatusCheckInterval();
          setIsUploading(false);
          setProcessingDocumentId(null);
          processingStartTimeRef.current = null;
          
          toast.destructive({
            title: "Document processing failed",
            description: data.processing_error || 'There was an error processing your document. Please try again.'
          });
        } else if (data.status === 'processing') {
          // Slow down the progress increase to reflect the longer expected processing time
          const elapsedTime = processingStartTimeRef.current 
            ? (Date.now() - processingStartTimeRef.current) / 1000 
            : 0;
            
          // More gradual progress increase over 4 minutes (240 seconds)
          if (elapsedTime > 5) {
            // Cap at 95% but make progress slower
            const calculatedProgress = Math.min(90 + (elapsedTime / 240) * 5, 95);
            setUploadProgress(calculatedProgress);
          }
        }
      } catch (error) {
        console.error('Error in status check:', error);
      }
    };

    // Check status immediately
    checkStatus();
    
    // Check every 3 seconds instead of 2
    const interval = setInterval(checkStatus, 3000);
    statusCheckIntervalRef.current = interval as unknown as number;

    // Set timeout to 5 minutes (300,000 ms) instead of 3 minutes
    const timeout = setTimeout(() => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
        processingStartTimeRef.current = null;
        
        if (isUploading) {
          setIsUploading(false);
          setUploadProgress(0);
          
          toast.destructive({
            title: "Processing timeout",
            description: "Document processing exceeded the maximum wait time of 5 minutes. Please try again with a smaller file or contact support."
          });
        }
      }
    }, 300000); // 5 minutes timeout
    
    timeoutRef.current = timeout as unknown as number;

    return () => {
      clearStatusCheckInterval();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      processingStartTimeRef.current = null;
    };
  }, [processingDocumentId, documentType]);

  const clearStatusCheckInterval = () => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase
      .storage
      .from('medical-documents')
      .createSignedUrl(filePath, 3600);
    
    return data?.signedUrl || null;
  };

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
    
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.destructive({
        title: "Invalid file type",
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.destructive({
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
    
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(droppedFile.type)) {
      toast.destructive({
        title: "Invalid file type",
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    if (droppedFile.size > 50 * 1024 * 1024) {
      toast.destructive({
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

    // Slower progress increase to reflect longer processing time
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 3; // Slower increment
      });
    }, 400); // Longer interval
    
    progressIntervalRef.current = progressInterval as unknown as number;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const SUPABASE_URL = "https://wgkbsiczgyaqmgoyirjs.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2JzaWN6Z3lhcW1nb3lpcmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODQ3NjcsImV4cCI6MjA1NTk2MDc2N30.WVI1UFFrL5A0_jYt-j7BDZJtzqHqnb5PXHZSGKr6qxE";
      
      // Show a toast before making the API call
      toast.default({
        title: "Uploading document",
        description: "Your document is being uploaded. Processing may take 3-4 minutes for larger files."
      });
      
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
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Edge Function Response:", data);
      
      setProcessingDocumentId(data.documentId);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setUploadProgress(95);
      
      toast.default({
        title: "Document uploaded",
        description: "Your document is now being processed with AI extraction. This may take 3-4 minutes."
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setIsUploading(false);
      setUploadProgress(0);
      
      toast.destructive({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'There was an error processing your document. Please try again.'
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
                    Your document will be securely processed with AI extraction (may take 3-4 minutes)
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
                          {uploadProgress >= 95 ? "Processing document with AI (3-4 mins)..." : "Uploading..."}
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
