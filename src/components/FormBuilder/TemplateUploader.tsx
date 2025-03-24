
import React, { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FilePdf, FileImage, Upload, Loader2 } from 'lucide-react';
import { FormTemplate } from './FormFieldTypes';
import { v4 as uuidv4 } from 'uuid';
import { FormBuilderService } from './FormBuilderService';

interface TemplateUploaderProps {
  onTemplateCreated: (template: FormTemplate) => void;
}

const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onTemplateCreated }) => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('General');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Auto-generate template name from filename
    if (selectedFile && !templateName) {
      // Remove extension and replace underscores/hyphens with spaces
      const nameFromFile = selectedFile.name
        .replace(/\.[^/.]+$/, "") // Remove extension
        .replace(/[_-]/g, " ") // Replace underscores and hyphens with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word
      
      setTemplateName(nameFromFile);
    }
  };
  
  const uploadDocument = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!templateName.trim()) {
      toast.error('Please provide a template name');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Create FormData to send to the edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'template');
      formData.append('userId', organizationId || '');
      formData.append('templateName', templateName);
      formData.append('category', category);
      
      // Simulated progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Call the process-document edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`,
        {
          method: 'POST',
          body: formData,
          headers: {
            // The authorization header will be added automatically by the fetch API
          }
        }
      );
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`Error uploading document: ${response.statusText}`);
      }
      
      setUploadProgress(95);
      
      const result = await response.json();
      
      // Create a new template from the document processing result
      const newTemplate: FormTemplate = {
        id: uuidv4(),
        name: templateName,
        description: `Generated from ${file.name}`,
        organizationId,
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublished: false,
        category,
      };
      
      // If the document was processed successfully, use the extracted fields
      if (result?.documentId) {
        // Poll for document processing completion
        let attempts = 0;
        const maxAttempts = 10;
        
        const checkProcessingStatus = async () => {
          const { data, error } = await FormBuilderService.checkDocumentProcessingStatus(result.documentId);
          
          if (error) {
            throw error;
          }
          
          if (data?.status === 'completed' && data?.extracted_data?.formFields) {
            // Extract form fields from the processed document
            newTemplate.fields = data.extracted_data.formFields;
            return true;
          } else if (data?.status === 'error') {
            throw new Error('Document processing failed');
          }
          
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Document processing timed out');
          }
          
          // Wait and try again
          await new Promise(resolve => setTimeout(resolve, 2000));
          return false;
        };
        
        // Check processing status until completed or max attempts reached
        let completed = false;
        while (!completed && attempts < maxAttempts) {
          completed = await checkProcessingStatus();
        }
      }
      
      // Save the template
      setUploadProgress(98);
      const savedTemplate = await FormBuilderService.saveFormTemplate(newTemplate);
      setUploadProgress(100);
      
      onTemplateCreated(savedTemplate);
    } catch (error) {
      console.error('Error creating template from document:', error);
      toast.error(error.message || 'Failed to create template from document');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Template from Document</CardTitle>
        <CardDescription>
          Upload an existing form to automatically create a template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
            disabled={isUploading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={category} 
            onValueChange={setCategory}
            disabled={isUploading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Medical">Medical</SelectItem>
              <SelectItem value="Assessment">Assessment</SelectItem>
              <SelectItem value="Registration">Registration</SelectItem>
              <SelectItem value="Feedback">Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="document-file">Upload Document</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {file ? (
              <div className="flex flex-col items-center">
                {file.type.includes('pdf') ? (
                  <FilePdf className="h-12 w-12 text-primary mb-2" />
                ) : (
                  <FileImage className="h-12 w-12 text-primary mb-2" />
                )}
                <p className="text-sm font-medium mb-1">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setFile(null)}
                  disabled={isUploading}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium mb-1">Drag and drop or click to upload</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Support for PDF, PNG, JPG (max 10MB)
                </p>
                <Input
                  id="document-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('document-file')?.click()}
                  disabled={isUploading}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading and processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={uploadDocument} 
          disabled={!file || isUploading || !templateName.trim()}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Document...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Create Template from Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateUploader;
