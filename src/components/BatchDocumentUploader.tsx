import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OrganizationCard from "./OrganizationCard";
import FileQueueTable from "./batch-upload/FileQueueTable";
import { FileUploadService } from "./batch-upload/FileUploadService";
import { BatchStorageService } from "./batch-upload/BatchStorageService";
import { Loader2, Upload, Save, Archive } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  QueuedFile, 
  FileStatus, 
  ReviewStatus, 
  BatchDocumentUploaderProps 
} from "./batch-upload/types";
import { 
  DOCUMENT_TYPES, 
  MAX_CONCURRENT_UPLOADS, 
  BATCH_DELAY 
} from "./batch-upload/constants";

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
    setHasSavedBatch(BatchStorageService.hasSavedBatch(organizationId, clientOrganizationId));
  }, [organizationId, clientOrganizationId]);

  // UPDATED: More robust file handling for better cross-browser compatibility
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input change event triggered');
    console.log('📁 Files selected:', e.target.files?.length);
  
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        documentType: defaultDocumentType,
        status: 'pending' as FileStatus,
        progress: 0,
        reviewStatus: 'not-reviewed' as ReviewStatus
      }));
    
      console.log('📁 Adding files to queue:', newFiles.length);
      setQueuedFiles(prev => [...prev, ...newFiles]);
      
      // 🔧 IMPROVED: Use setTimeout to clear input value after React has processed the change
      // This prevents Chrome from becoming non-responsive on macOS
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 100);
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
      
      let successCount = 0;
      let failCount = 0;
      const results = [];
      
      for (let i = 0; i < pendingFiles.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingFiles.slice(i, i + MAX_CONCURRENT_UPLOADS);
        
        const batchPromises = batch.map(async (fileItem) => {
          const fileIndex = queuedFiles.findIndex(f => f === fileItem);
          if (fileIndex !== -1) {
            try {
              const result = await FileUploadService.uploadFile(
                fileItem, 
                fileIndex, 
                updateFileProgress, 
                updateFileStatus,
                patientId,
                organizationId,
                clientOrganizationId
              );
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
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));
        
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
      
      // 🔧 IMPROVED: Clear file input more safely after upload completion
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 200);
    }
  };

  const saveBatchProgress = () => {
    const success = BatchStorageService.saveBatch(
      queuedFiles, 
      defaultDocumentType, 
      organizationId!, 
      clientOrganizationId
    );
    if (success) {
      setHasSavedBatch(true);
    }
  };

  const loadSavedBatch = () => {
    const restoredFiles = BatchStorageService.loadBatch(organizationId!, clientOrganizationId);
    if (restoredFiles) {
      setQueuedFiles(prev => [...prev, ...restoredFiles]);
      
      // Verify document status after loading - check each file's status
      restoredFiles.forEach(async (file, index) => {
        if (file.documentId) {
          try {
            const { data, error } = await supabase
              .from('documents')
              .select('status')
              .eq('id', file.documentId as any)
              .single();
              
            if (!error && data && 'status' in data) {
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
          } catch (error) {
            console.error('Error checking document status:', error);
          }
        }
      });
    }
  };

  const clearSavedBatch = () => {
    BatchStorageService.clearBatch(organizationId!, clientOrganizationId);
    setHasSavedBatch(false);
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
            key={queuedFiles.length} // Force re-render to ensure clean state
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
            
            <FileQueueTable 
              queuedFiles={queuedFiles}
              uploading={uploading}
              onRemoveFile={handleRemoveFile}
              onSetDocumentType={handleSetDocumentType}
              onUpdateReviewStatus={updateFileReviewStatus}
            />
            
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
