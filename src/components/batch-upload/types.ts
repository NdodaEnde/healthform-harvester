
export type FileStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
export type ReviewStatus = 'not-reviewed' | 'reviewed' | 'needs-correction';

export interface QueuedFile {
  file: File;
  documentType: string;
  status: FileStatus;
  progress: number;
  error?: string;
  documentId?: string;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
}

export interface SavedFile {
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

export interface SavedBatch {
  timestamp: number;
  files: SavedFile[];
  defaultDocumentType: string;
}

export interface BatchDocumentUploaderProps {
  onUploadComplete?: (data?: any) => void;
  organizationId?: string;
  clientOrganizationId?: string;
  patientId?: string;
}
