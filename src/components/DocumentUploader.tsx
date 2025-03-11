
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, X, Loader2, FileCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const maxPollingAttempts = 20; // About 60 seconds with 3-second intervals

  useEffect(() => {
    if (!processingDocumentId) return;

    const checkStatus = async () => {
      try {
        console.log(`Checking status for document ID: ${processingDocumentId}`);
        
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', processingDocumentId)
          .maybeSingle();
        
        pollingAttemptsRef.current++;
        console.log(`Polling attempt ${pollingAttemptsRef.current} of ${maxPollingAttempts}`);

        if (error) {
          console.error('Error checking document status:', error);
          return;
        }

        if (!data) {
          console.log('Document not found, it might still be processing');
          
          if (pollingAttemptsRef.current >= maxPollingAttempts) {
            console.log("Maximum polling attempts reached, stopping polling");
            
            if (statusPollingRef.current) {
              clearInterval(statusPollingRef.current);
              statusPollingRef.current = null;
            }
            
            setIsUploading(false);
            toast.error("Document processing timeout", {
              description: "Unable to verify document status. Please check the dashboard for updates."
            });
            return;
          }
          
          return;
        }

        console.log(`Document found with status: ${data.status}`, data);

        if (data.status === 'processing' && pollingAttemptsRef.current > maxPollingAttempts / 2) {
          console.log('Document has been in processing state for a long time, checking directly');
          
          const freshCheck = await supabase
            .from('documents')
            .select('*')
            .eq('id', processingDocumentId)
            .maybeSingle();
            
          if (freshCheck.data && freshCheck.data.status === 'processed') {
            console.log('Found document is actually processed with fresh check!', freshCheck.data);
            data.status = 'processed';
            data.extracted_data = freshCheck.data.extracted_data;
          }
        }

        if (data.status === 'processed') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
          }
          
          setUploadProgress(100);
          
          console.log("Processing document with raw data:", data.extracted_data);
          
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
            setProcessingDocumentId(null);
            onUploadComplete(processedData);
            
            toast.success("Document processed successfully", {
              description: "Your document has been processed using AI extraction."
            });
          }, 500);
        } else if (data.status === 'failed') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
          }
          
          setIsUploading(false);
          setProcessingDocumentId(null);
          
          const errorMessage = data.processing_error || 'There was an error processing your document.';
          const isApiKeyError = errorMessage.includes('API key is not configured');
          
          if (isApiKeyError) {
            toast.error("API Configuration Required", {
              description: "The Landing AI API key is not configured. Please set up the API key in the Supabase secrets."
            });
          } else {
            toast.error("Document processing failed", {
              description: errorMessage
            });
          }
        } else if (data.status === 'processing' && pollingAttemptsRef.current >= maxPollingAttempts) {
          console.log("Maximum polling attempts reached but document is still processing");
          
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
          }
          
          setIsUploading(false);
          setProcessingDocumentId(null);
          
          toast("Document still processing", {
            description: "The document is taking longer than expected to process. You can check the dashboard later for results.",
          });
        }
      } catch (error) {
        console.error('Error in status check:', error);
        
        if (pollingAttemptsRef.current >= maxPollingAttempts) {
          if (statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
          }
          
          setIsUploading(false);
          setProcessingDocumentId(null);
          
          toast.error("Error checking document status", {
            description: "Please check the dashboard for document status."
          });
        }
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 3000);
    statusPollingRef.current = interval;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
    };
  }, [processingDocumentId, documentType, maxPollingAttempts, onUploadComplete]);

  const getFileUrl = async (filePath: string) => {
    try {
      const { data } = await supabase
        .storage
        .from('medical-documents')
        .createSignedUrl(filePath, 3600);
        
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const extractPatientName = (extractedData: any) => {
    if (!extractedData) return "Unknown";
    
    if (extractedData.structured_data && extractedData.structured_data.patient) {
      return extractedData.structured_data.patient.name || "Unknown";
    }
    
    if (extractedData.raw_response && extractedData.raw_response.data && 
        extractedData.raw_response.data.markdown) {
      
      const markdown = extractedData.raw_response.data.markdown;
      const namePatterns = [
        /\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$)/,
        /\*\*Name\*\*:\s*(.*?)(?=\n|\r|$)/,
        /Name:\s*(.*?)(?=\n|\r|$)/
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = markdown.match(pattern);
        if (nameMatch && nameMatch[1]) {
          return nameMatch[1].trim();
        }
      }
    }
    
    return "Unknown";
  };
  
  const extractPatientId = (extractedData: any) => {
    if (!extractedData) return "No ID";
    
    if (extractedData.structured_data && extractedData.structured_data.patient) {
      return extractedData.structured_data.patient.employee_id || 
             extractedData.structured_data.patient.id_number || 
             extractedData.structured_data.patient.id || 
             "No ID";
    }
    
    if (extractedData.raw_response && extractedData.raw_response.data && 
        extractedData.raw_response.data.markdown) {
      
      const markdown = extractedData.raw_response.data.markdown;
      const idPatterns = [
        /\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$)/i,
        /\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$)/i,
        /ID No[.:]\s*(.*?)(?=\n|\r|$)/i,
        /ID NO[.:]\s*(.*?)(?=\n|\r|$)/i
      ];
      
      for (const pattern of idPatterns) {
        const idMatch = markdown.match(pattern);
        if (idMatch && idMatch[1]) {
          return idMatch[1].trim();
        }
      }
    }
    
    return "No ID";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File too large", {
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
      toast.error("Invalid file type", {
        description: "Please upload a PDF, PNG, or JPEG file."
      });
      return;
    }
    
    if (droppedFile.size > 50 * 1024 * 1024) {
      toast.error("File too large", {
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
    pollingAttemptsRef.current = 0;

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          return 90;
        }
        return prev + 5;
      });
    }, 300);
    
    progressIntervalRef.current = progressInterval;

    try {
      // Check for user authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsUploading(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        toast.error("Authentication required", {
          description: "You need to be logged in to upload documents."
        });
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('userId', user.id);
      
      const SUPABASE_URL = "https://wgkbsiczgyaqmgoyirjs.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indna2JzaWN6Z3lhcW1nb3lpcmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODQ3NjcsImV4cCI6MjA1NTk2MDc2N30.WVI1UFFrL5A0_jYt-j7BDZJtzqHqnb5PXHZSGKr6qxE";
      
      console.log('Calling process-document edge function with form data', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        userID: user.id
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
        console.error(`Edge function error (${response.status}):`, errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Edge Function Response:", data);
      
      setProcessingDocumentId(data.documentId);
      
      const timeout = setTimeout(() => {
        if (statusPollingRef.current) {
          clearInterval(statusPollingRef.current);
          statusPollingRef.current = null;
          
          if (isUploading) {
            setIsUploading(false);
            setProcessingDocumentId(null);
            setUploadProgress(0);
            
            toast.error("Processing timeout", {
              description: "Document processing took too long. The document might still be processing in the background."
            });
          }
        }
      }, 60000);
      
      setUploadProgress(95);
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setIsUploading(false);
      setProcessingDocumentId(null);
      setUploadProgress(0);
      
      toast.error("Upload failed", {
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
