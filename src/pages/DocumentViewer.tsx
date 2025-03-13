
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import CertificateTemplate from '@/components/CertificateTemplate';
import CertificateValidator from '@/components/CertificateValidator';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Basic document viewer component
const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [hideOriginal, setHideOriginal] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        // Fetch document metadata
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setDocument(data);

        // Get download URL for the document
        if (data.file_path) {
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from('medical-documents')
            .createSignedUrl(data.file_path, 3600); // 1 hour expiry

          if (fileError) throw fileError;
          setFileUrl(fileData.signedUrl);
        }
      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (editMode) {
      // Cancel edit mode
      setEditMode(false);
      setEditedData(null);
    } else {
      // Enter edit mode
      setEditMode(true);
      // Make sure to create a deep copy of the extracted_data to avoid reference issues
      setEditedData(document.extracted_data ? JSON.parse(JSON.stringify(document.extracted_data)) : {});
    }
  };

  // Handle data changes from certificate editor
  const handleDataChange = (updatedData: any) => {
    console.log("Data changed in DocumentViewer:", updatedData);
    // Create a new copy to ensure React detects the change
    setEditedData({...updatedData});
  };

  // Save edited data
  const saveEditedData = async () => {
    if (!id || !editedData) return;
    
    setSaving(true);
    try {
      console.log("Saving data to database:", editedData);
      const { error } = await supabase
        .from('documents')
        .update({ extracted_data: editedData })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local document state with new data
      setDocument({
        ...document,
        extracted_data: editedData
      });
      
      setEditMode(false);
      toast.success('Certificate data updated successfully');
    } catch (err: any) {
      console.error('Error saving data:', err);
      toast.error('Failed to save data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle save from CertificateValidator component
  const handleValidatorSave = (validatedData: any) => {
    // Update document with validated data
    setDocument({
      ...document,
      extracted_data: validatedData
    });
    
    // Exit edit mode
    setEditMode(false);
    toast.success('Certificate data updated successfully');
  };

  // Handle cancel from CertificateValidator component
  const handleValidatorCancel = () => {
    setEditMode(false);
    setEditedData(null);
  };

  // Toggle visibility of original document
  const toggleOriginalVisibility = () => {
    setHideOriginal(!hideOriginal);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="container py-10 flex justify-center">
            <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="container py-10">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>Error: {error || 'Document not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if this is a certificate of fitness document - handle different variations of the type name
  const isCertificateOfFitness = 
    document.document_type === 'certificate-of-fitness' || 
    document.document_type === 'certificate-fitness' || 
    document.document_type === 'certificate_of_fitness';

  console.log('Document type:', document.document_type);
  console.log('Is certificate of fitness:', isCertificateOfFitness);
  console.log('Has extracted data:', !!document.extracted_data);
  console.log('Edit mode:', editMode);
  console.log('Edited data:', editedData);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="container py-10">
          <h1 className="text-2xl font-bold mb-6">{document.file_name}</h1>
          
          {/* Toggle for hiding original document - only show for certificates with data */}
          {isCertificateOfFitness && document.extracted_data && !editMode && (
            <div className="mb-6 flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleOriginalVisibility}
                className="flex items-center gap-2"
              >
                {hideOriginal ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Show Original Document
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Original Document
                  </>
                )}
              </Button>
            </div>
          )}
          
          {editMode && isCertificateOfFitness ? (
            // Validation/Edit mode
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-medium">Edit Certificate of Fitness</h2>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleEditMode}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={saveEditedData}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin mr-1 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-1 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <CertificateValidator 
                documentId={id || ''}
                extractedData={document.extracted_data}
                onSave={handleValidatorSave}
                onCancel={handleValidatorCancel}
                initialData={editedData}
              />
            </div>
          ) : (
            // View mode
            <div className={`grid ${hideOriginal ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
              {/* Document Preview - hide when toggle is active */}
              {!hideOriginal && (
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-medium">Document Preview</h2>
                  </div>
                  <div className="p-4">
                    {fileUrl ? (
                      document.file_name.endsWith('.pdf') ? (
                        <iframe 
                          src={fileUrl} 
                          className="w-full h-[600px]" 
                          title="Document Preview"
                        />
                      ) : (
                        <img 
                          src={fileUrl} 
                          alt="Document Preview" 
                          className="max-w-full" 
                        />
                      )
                    ) : (
                      <p>No preview available</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Certificate Template or Document Details */}
              {isCertificateOfFitness && document.extracted_data ? (
                <div className={`bg-white border rounded-lg shadow-sm overflow-hidden h-[600px] ${hideOriginal ? 'max-w-4xl mx-auto' : ''}`}>
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-medium">Certificate of Fitness</h2>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={toggleEditMode}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                  <CertificateTemplate 
                    extractedData={document.extracted_data} 
                    isEditable={false}
                    onDataChange={() => {}}
                  />
                </div>
              ) : (
                <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="font-medium">Document Details</h2>
                  </div>
                  <div className="p-4">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">File Name</dt>
                        <dd className="mt-1">{document.file_name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Type</dt>
                        <dd className="mt-1">{document.document_type || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Upload Date</dt>
                        <dd className="mt-1">{new Date(document.created_at).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1">{document.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Extracted Data</dt>
                        <dd className="mt-1">
                          <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-[300px]">
                            {document.extracted_data ? JSON.stringify(document.extracted_data, null, 2) : 'No data extracted'}
                          </pre>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
