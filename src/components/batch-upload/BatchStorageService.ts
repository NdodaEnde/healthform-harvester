
import { SavedBatch, SavedFile, QueuedFile } from "./types";
import { BATCH_LOCAL_STORAGE_KEY } from "./constants";
import { toast } from "@/hooks/use-toast";

export class BatchStorageService {
  static getSavedBatchKey(organizationId: string, clientOrganizationId?: string): string {
    return `${BATCH_LOCAL_STORAGE_KEY}${organizationId}${clientOrganizationId ? `-${clientOrganizationId}` : ''}`;
  }

  static hasSavedBatch(organizationId: string, clientOrganizationId?: string): boolean {
    const key = this.getSavedBatchKey(organizationId, clientOrganizationId);
    return !!localStorage.getItem(key);
  }

  static saveBatch(
    queuedFiles: QueuedFile[], 
    defaultDocumentType: string, 
    organizationId: string, 
    clientOrganizationId?: string
  ): boolean {
    if (!organizationId || queuedFiles.length === 0) return false;
    
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
      
      const key = this.getSavedBatchKey(organizationId, clientOrganizationId);
      localStorage.setItem(key, JSON.stringify(batchToSave));
      
      toast({
        title: "Batch progress saved",
        description: `You can continue this batch later`,
      });
      
      return true;
    } catch (error) {
      console.error("Error saving batch progress:", error);
      toast({
        title: "Could not save progress",
        description: "There was an error saving your batch progress",
        variant: "destructive"
      });
      return false;
    }
  }

  static loadBatch(organizationId: string, clientOrganizationId?: string): QueuedFile[] | null {
    if (!organizationId) return null;
    
    try {
      const key = this.getSavedBatchKey(organizationId, clientOrganizationId);
      const savedBatchJson = localStorage.getItem(key);
      
      if (!savedBatchJson) {
        toast({
          title: "No saved batch found",
          description: "Could not find a previously saved batch",
          variant: "destructive"
        });
        return null;
      }
      
      const savedBatch: SavedBatch = JSON.parse(savedBatchJson);
      
      const loadableFiles = savedBatch.files.filter(file => 
        (file.status === 'complete' || file.status === 'processing') && file.documentId
      );
      
      if (loadableFiles.length === 0) {
        toast({
          title: "No documents to restore",
          description: "The saved batch does not contain any processed documents",
          variant: "destructive"
        });
        localStorage.removeItem(key);
        return null;
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
      
      toast({
        title: "Batch restored",
        description: `Restored ${restoredFiles.length} document(s) from your saved batch`,
      });
      
      return restoredFiles;
      
    } catch (error) {
      console.error("Error loading saved batch:", error);
      toast({
        title: "Could not load saved batch",
        description: "There was an error loading your saved batch",
        variant: "destructive"
      });
      return null;
    }
  }

  static clearBatch(organizationId: string, clientOrganizationId?: string): void {
    if (!organizationId) return;
    
    const key = this.getSavedBatchKey(organizationId, clientOrganizationId);
    localStorage.removeItem(key);
    
    toast({
      title: "Saved batch cleared",
      description: "Your saved batch has been cleared"
    });
  }
}
