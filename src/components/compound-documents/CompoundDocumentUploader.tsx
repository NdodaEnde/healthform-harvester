
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  X, 
  AlertCircle, 
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { useCompoundDocuments } from '@/hooks/useCompoundDocuments';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  documentId?: string;
}

const CompoundDocumentUploader = () => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [patientId, setPatientId] = useState<string>('');
  const { createCompoundDocument, refreshDocuments } = useCompoundDocuments();
  const { getEffectiveOrganizationId } = useOrganization();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
    e.target.value = '';
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      // Accept PDF and common image formats for multi-page documents
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    const newUploadFiles: UploadFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFileStatus = useCallback((id: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  }, []);

  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    const { file, id } = uploadFile;
    const organizationId = getEffectiveOrganizationId();
    
    if (!organizationId) {
      updateFileStatus(id, { status: 'error', error: 'No organization selected' });
      return;
    }

    try {
      updateFileStatus(id, { status: 'uploading', progress: 10 });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create storage path
      const timestamp = new Date().getTime();
      const filePath = `compound-documents/${organizationId}/${timestamp}_${file.name}`;

      // Upload to storage first
      updateFileStatus(id, { progress: 30 });
      const { data: storageData, error: storageError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600'
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('medical-documents')
        .getPublicUrl(filePath);

      updateFileStatus(id, { progress: 60 });

      // Create compound document record
      const documentData = await createCompoundDocument({
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        public_url: urlData.publicUrl,
        owner_id: patientId || null,
        total_pages: 0, // Will be updated during processing
        detected_sections: [],
        processing_metadata: {
          upload_timestamp: timestamp,
          original_name: file.name
        },
        workflow_status: 'receptionist_review'
      });

      updateFileStatus(id, { 
        status: 'processing', 
        progress: 80,
        documentId: documentData.id 
      });

      // Simulate processing time
      setTimeout(() => {
        updateFileStatus(id, { 
          status: 'completed', 
          progress: 100 
        });
        refreshDocuments();
      }, 2000);

    } catch (error: any) {
      console.error('Error uploading compound document:', error);
      updateFileStatus(id, { 
        status: 'error', 
        error: error.message || 'Upload failed' 
      });
    }
  }, [createCompoundDocument, getEffectiveOrganizationId, patientId, refreshDocuments, updateFileStatus]);

  const uploadAll = useCallback(() => {
    uploadFiles
      .filter(f => f.status === 'pending')
      .forEach(uploadFile);
  }, [uploadFiles, uploadFile]);

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'uploading':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Compound Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Assignment */}
        <div className="space-y-2">
          <Label htmlFor="patientId">Link to Patient (Optional)</Label>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <Input
              id="patientId"
              placeholder="Enter patient ID to link documents"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop compound documents here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Support for PDF, PNG, JPEG, TIFF files up to 50MB
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Browse Files
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.tiff"
                  onChange={handleFileSelect}
                />
              </label>
            </Button>
          </div>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Files Ready for Upload</h3>
              <Button 
                onClick={uploadAll}
                disabled={!uploadFiles.some(f => f.status === 'pending')}
              >
                Upload All
              </Button>
            </div>

            <div className="space-y-2">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {getStatusIcon(uploadFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    
                    {uploadFile.status !== 'pending' && uploadFile.status !== 'completed' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-sm text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  <Badge className={getStatusColor(uploadFile.status)}>
                    {uploadFile.status.replace('_', ' ').toUpperCase()}
                  </Badge>

                  {uploadFile.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompoundDocumentUploader;
