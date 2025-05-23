
import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2, X, FileText, Upload, CheckCircle, AlertCircle, Eye, Save, Archive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OrganizationCard from "./OrganizationCard";

const DOCUMENT_TYPES = [
  { label: "Certificate of Fitness", value: "certificate-fitness" },
  { label: "Medical Questionnaire", value: "medical-questionnaire" },
  { label: "Medical Report", value: "medical-report" },
  { label: "Audiogram", value: "audiogram" },
  { label: "Spirometry", value: "spirometry" },
  { label: "X-Ray Report", value: "xray-report" },
  { label: "Other", value: "other" }
];

const BATCH_LOCAL_STORAGE_KEY = "doc-batch-";
// Batch size for concurrent uploads - smaller to avoid overloading the server
const MAX_CONCURRENT_UPLOADS = 2;
// Delay between batches to prevent rate limiting (in ms)
const BATCH_DELAY = 1000;

export interface BatchDocumentUploaderProps {
  onUploadComplete?: (data?: any) => void;
  organizationId?: string;
  clientOrganizationId?: string;
  patientId?: string;
}

type FileStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

interface QueuedFile {
  file: File;
  documentType: string;
  status: FileStatus;
  progress: number;
  error?: string;
  documentId?: string;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
}

interface SavedFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  status: FileStatus;
  progress: number;
  error?: string;
  documentId?: string;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
}

interface SavedBatch {
  timestamp: number;
  files: SavedFile[];
  defaultDocumentType: string;
}

const BatchDocumentUploader = ({ 
  onUploadComplete,
  organizationId,
  clientOrganizationId,
  patientId
}: BatchDocumentUploaderProps) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [defaultDocumentType, setDefaultDocumentType] = useState<string>("certificate-fitness");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasSavedBatch, setHasSavedBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!organizationId) return;
    
    const savedBatchKey = `${BATCH_LOCAL_STORAGE_KEY}${organizationId}${clientOrganizationId ? `-${clientOrganizationId}` : ''}`;
    const savedBatchJson = localStorage.getItem(savedBatchKey);
    
    if (savedBatchJson) {
      try {
        setHasSavedBatch(true);
      } catch (e) {
        console.error("Error parsing saved batch", e);
        localStorage.removeItem(savedBatchKey);
      }
    }
  }, [organizationId, clientOrganizationId]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        documentType: defaultDocumentType,
        status: 'pending' as FileStatus,
        progress: 0,
        reviewStatus: 'not-reviewed' as ReviewStatus
      }));
      
      setQueuedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setQueuedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    if (!uploading && !processing) {
      setQueuedFiles([]);
    }
  };

  const handleSetDocumentType = (index: number, type: string) => {
    setQueuedFiles(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, documentType: type } : item
      )
    );
  };

  const handleSetAllDocumentTypes = (type: string) => {
    setDefaultDocumentType(type);
    
    setQueuedFiles(prev => 
      prev.map(item => 
        item.status === 'pending' ? { ...item, documentType: type } : item
      )
    );
  };

  const updateFileProgress = (index: number, progress: number) => {
    setQueuedFiles(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, progress } : item
      )
    );
  };

  const updateFileStatus = (index: number, status: FileStatus, documentId?: string, error?: string) => {
    setQueuedFiles(prev => 
      prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status, 
          documentId: documentId || item.documentId,
          error: error || item.error
        } : item
      )
    );
  };

  const updateFileReviewStatus = (index: number, reviewStatus: ReviewStatus, reviewNote?: string) => {
    setQueuedFiles(prev => 
      prev.map((item, i) => 
        i === index ? { 
          ...item, 
          reviewStatus,
          reviewNote: reviewNote || item.reviewNote
        } : item
      )
    );
  };

  const uploadFile = async (fileItem: QueuedFile, index: number) => {
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

      // Create a simulated progress updater
      const progressInterval = setInterval(() => {
        updateFileProgress(index, Math.min(
          (queuedFiles[index]?.progress || 0) + Math.random() * 5, 
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
        
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            organization_id: organizationId,
            client_organization_id: clientOrganizationId || null,
            owner_id: patientId || null 
          })
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
  };

  const processBatch = async () => {
    if (queuedFiles.length === 0) {
      toast({
        title: "No files in queue",
        description: "Please add files to the upload queue first",
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
      setProcessing(true);
      
      const pendingFiles = queuedFiles.filter(f => f.status === 'pending');
      
      if (pendingFiles.length === 0) {
        setUploading(false);
        return;
      }
      
      toast({
        title: "Batch upload started",
        description: `Uploading ${pendingFiles.length} document(s)`,
      });
      
      // Process in smaller batches to prevent overwhelming the server
      let successCount = 0;
      let failCount = 0;
      const results = [];
      
      // Process files in batches of MAX_CONCURRENT_UPLOADS
      for (let i = 0; i < pendingFiles.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingFiles.slice(i, i + MAX_CONCURRENT_UPLOADS);
        
        // Process this batch concurrently
        const batchPromises = batch.map(async (fileItem) => {
          const fileIndex = queuedFiles.findIndex(f => f === fileItem);
          if (fileIndex !== -1) {
            try {
              const result = await uploadFile(fileItem, fileIndex);
              successCount++;
              return result;
            } catch (error) {
              console.error(`Error processing file:`, error);
              failCount++;
              return null;
            }
          }
          return null;
        });
        
        // Wait for this batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));
        
        // Add a delay between batches to prevent rate limiting
        if (i + MAX_CONCURRENT_UPLOADS < pendingFiles.length) {
          console.log(`Waiting ${BATCH_DELAY}ms before processing next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
      
      toast({
        title: "Batch upload complete",
        description: `Successfully uploaded ${successCount} document(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });
      
      if (onUploadComplete && results.length > 0) {
        onUploadComplete(results);
      }
    } catch (error: any) {
      console.error("Batch processing error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your documents",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProcessing(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveBatchProgress = () => {
    if (!organizationId || queuedFiles.length === 0) return;
    
    try {
      const savedFiles: SavedFile[] = queuedFiles.map(file => ({
        fileName: file.file.name,
        fileType: file.file.type,
        fileSize: file.file.size,
        documentType: file.documentType,
        status: file.status,
        progress: file.progress,
        error: file.error,
        documentId: file.documentId,
        reviewStatus: file.reviewStatus || 'not-reviewed',
        reviewNote: file.reviewNote
      }));
      
      const batchToSave: SavedBatch = {
        timestamp: Date.now(),
        files: savedFiles,
        defaultDocumentType
      };
      
      const savedBatchKey = `${BATCH_LOCAL_STORAGE_KEY}${organizationId}${clientOrganizationId ? `-${clientOrganizationId}` : ''}`;
      localStorage.setItem(savedBatchKey, JSON.stringify(batchToSave));
      
      toast({
        title: "Batch progress saved",
        description: `You can continue this batch later`,
      });
      
      setHasSavedBatch(true);
    } catch (error) {
      console.error("Error saving batch progress:", error);
      toast({
        title: "Could not save progress",
        description: "There was an error saving your batch progress",
        variant: "destructive"
      });
    }
  };

  const loadSavedBatch = () => {
    if (!organizationId) return;
    
    try {
      const savedBatchKey = `${BATCH_LOCAL_STORAGE_KEY}${organizationId}${clientOrganizationId ? `-${clientOrganizationId}` : ''}`;
      const savedBatchJson = localStorage.getItem(savedBatchKey);
      
      if (!savedBatchJson) {
        toast({
          title: "No saved batch found",
          description: "Could not find a previously saved batch",
          variant: "destructive"
        });
        return;
      }
      
      const savedBatch: SavedBatch = JSON.parse(savedBatchJson);
      setDefaultDocumentType(savedBatch.defaultDocumentType);
      
      const loadableFiles = savedBatch.files.filter(file => 
        (file.status === 'complete' || file.status === 'processing') && file.documentId
      );
      
      if (loadableFiles.length === 0) {
        toast({
          title: "No documents to restore",
          description: "The saved batch does not contain any processed documents",
          variant: "destructive"
        });
        localStorage.removeItem(savedBatchKey);
        setHasSavedBatch(false);
        return;
      }
      
      const restoredFiles: QueuedFile[] = loadableFiles.map(file => ({
        file: new File([], file.fileName, { type: file.fileType }),
        documentType: file.documentType,
        status: file.status,
        progress: file.progress,
        error: file.error,
        documentId: file.documentId,
        reviewStatus: file.reviewStatus,
        reviewNote: file.reviewNote
      }));
      
      setQueuedFiles(prev => [...prev, ...restoredFiles]);
      
      toast({
        title: "Batch restored",
        description: `Restored ${restoredFiles.length} document(s) from your saved batch`,
      });
      
      restoredFiles.forEach(async (file, index) => {
        if (file.documentId) {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', file.documentId)
            .single();
            
          if (!error && data) {
            const updatedStatus = data.status === 'completed' 
              ? 'complete' as FileStatus 
              : data.status === 'processing' 
                ? 'processing' as FileStatus 
                : file.status;
                
            setQueuedFiles(prev => 
              prev.map((item, i) => 
                i === prev.length - restoredFiles.length + index 
                  ? { ...item, status: updatedStatus } 
                  : item
              )
            );
          }
        }
      });
      
    } catch (error) {
      console.error("Error loading saved batch:", error);
      toast({
        title: "Could not load saved batch",
        description: "There was an error loading your saved batch",
        variant: "destructive"
      });
    }
  };

  const clearSavedBatch = () => {
    if (!organizationId) return;
    
    const savedBatchKey = `${BATCH_LOCAL_STORAGE_KEY}${organizationId}${clientOrganizationId ? `-${clientOrganizationId}` : ''}`;
    localStorage.removeItem(savedBatchKey);
    setHasSavedBatch(false);
    
    toast({
      title: "Saved batch cleared",
      description: "Your saved batch has been cleared"
    });
  };

  const getOverallProgress = () => {
    if (queuedFiles.length === 0) return 0;
    const totalProgress = queuedFiles.reduce((sum, file) => sum + file.progress, 0);
    return Math.round(totalProgress / queuedFiles.length);
  };

  const pendingCount = queuedFiles.filter(f => f.status === 'pending').length;
  const processingCount = queuedFiles.filter(f => f.status === 'processing').length;
  const completedCount = queuedFiles.filter(f => f.status === 'complete').length;
  const errorCount = queuedFiles.filter(f => f.status === 'error').length;
  const totalCount = queuedFiles.length;
  
  const notReviewedCount = queuedFiles.filter(f => 
    (f.status === 'complete' || f.status === 'processing') && 
    (!f.reviewStatus || f.reviewStatus === 'not-reviewed')
  ).length;
  const reviewedCount = queuedFiles.filter(f => f.reviewStatus === 'reviewed').length;
  const needsCorrectionCount = queuedFiles.filter(f => f.reviewStatus === 'needs-correction').length;

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getReviewStatusBadge = (reviewStatus: ReviewStatus | undefined) => {
    if (!reviewStatus || reviewStatus === 'not-reviewed') {
      return <Badge variant="outline" className="text-xs">Not Reviewed</Badge>;
    } else if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600 text-white">Reviewed</Badge>;
    } else if (reviewStatus === 'needs-correction') {
      return <Badge variant="destructive" className="text-xs">Needs Correction</Badge>;
    }
  };
  
  const cardActions = (
    <>
      {queuedFiles.length > 0 && !uploading && !processing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={saveBatchProgress}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save batch progress</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {hasSavedBatch && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={loadSavedBatch}>
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load saved batch</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );

  return (
    <OrganizationCard title="Batch Document Upload" actions={cardActions}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="document-type">Default Document Type</Label>
          <Select 
            value={defaultDocumentType} 
            onValueChange={handleSetAllDocumentTypes}
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
          <p className="text-xs text-muted-foreground">
            This type will be applied to all new files added to the queue
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="files">Select Documents</Label>
          <Input 
            id="files" 
            type="file" 
            onChange={handleFilesChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
            disabled={uploading}
            multiple
            ref={fileInputRef}
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, PNG, JPG, JPEG, DOC, DOCX, TXT
          </p>
        </div>

        {organizationId && (
          <div className="text-xs text-muted-foreground">
            {clientOrganizationId ? (
              <p>These documents will be uploaded for client organization</p>
            ) : (
              <p>These documents will be uploaded to your organization</p>
            )}
          </div>
        )}
        
        {hasSavedBatch && (
          <div className="bg-muted p-3 rounded-md text-sm flex items-center justify-between">
            <div>
              <p className="font-medium">You have a saved batch</p>
              <p className="text-xs text-muted-foreground">You can load your previously saved progress</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadSavedBatch}>
                <Archive className="h-4 w-4 mr-1" /> Load
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSavedBatch}>
                Clear
              </Button>
            </div>
          </div>
        )}
        
        {queuedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Upload Queue ({totalCount} files)
                {pendingCount > 0 && <span className="text-muted-foreground ml-2">{pendingCount} pending</span>}
                {processingCount > 0 && <span className="text-amber-500 ml-2">{processingCount} processing</span>}
                {completedCount > 0 && <span className="text-green-500 ml-2">{completedCount} completed</span>}
                {errorCount > 0 && <span className="text-red-500 ml-2">{errorCount} failed</span>}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearQueue}
                disabled={uploading || processing}
              >
                Clear Queue
              </Button>
            </div>
            
            {completedCount > 0 && (
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm">
                  <span className="font-medium">Review Status:</span>
                  {notReviewedCount > 0 && <span className="text-muted-foreground ml-2">{notReviewedCount} not reviewed</span>}
                  {reviewedCount > 0 && <span className="text-green-500 ml-2">{reviewedCount} reviewed</span>}
                  {needsCorrectionCount > 0 && <span className="text-red-500 ml-2">{needsCorrectionCount} needs correction</span>}
                </div>
              </div>
            )}
            
            <Card>
              <CardHeader className="py-2 px-4">
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
                  <div className="col-span-5">Filename</div>
                  <div className="col-span-2">Document Type</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Review</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[240px] w-full rounded-md border">
                  <div className="p-2 space-y-2">
                    {queuedFiles.map((queuedFile, index) => (
                      <div 
                        key={index}
                        className="grid grid-cols-12 gap-2 p-2 text-sm items-center border-b last:border-b-0"
                      >
                        <div className="col-span-5 flex items-center gap-2 truncate">
                          {getStatusIcon(queuedFile.status)}
                          <span className="truncate" title={queuedFile.file.name}>
                            {queuedFile.file.name}
                          </span>
                        </div>
                        <div className="col-span-2">
                          {queuedFile.status === 'pending' ? (
                            <Select 
                              value={queuedFile.documentType} 
                              onValueChange={(value) => handleSetDocumentType(index, value)}
                              disabled={uploading}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {DOCUMENT_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs">
                              {DOCUMENT_TYPES.find(t => t.value === queuedFile.documentType)?.label || queuedFile.documentType}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          {queuedFile.status === 'uploading' || queuedFile.status === 'processing' ? (
                            <Progress value={queuedFile.progress} className="h-2" />
                          ) : queuedFile.status === 'error' ? (
                            <span className="text-xs text-red-500" title={queuedFile.error}>
                              Failed
                            </span>
                          ) : queuedFile.status === 'complete' ? (
                            <span className="text-xs text-green-500">
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="col-span-2">
                          {(queuedFile.status === 'complete' || queuedFile.documentId) && (
                            <div className="flex gap-1 items-center">
                              {getReviewStatusBadge(queuedFile.reviewStatus)}
                              
                              {queuedFile.documentId && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => {
                                          window.open(`/document/${queuedFile.documentId}`, '_blank');
                                        }}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View document</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {queuedFile.documentId && (
                                <div className="flex gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => updateFileReviewStatus(index, 'reviewed')}
                                        >
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Mark as reviewed</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => updateFileReviewStatus(index, 'needs-correction')}
                                        >
                                          <AlertCircle className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Needs correction</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {queuedFile.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveFile(index)}
                              disabled={uploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {(uploading || processing) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{getOverallProgress()}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={processBatch} 
            disabled={pendingCount === 0 || uploading || !organizationId}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                <span>Start Batch Upload</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </OrganizationCard>
  );
};

export default BatchDocumentUploader;
