
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import CertificateTemplate from '@/components/CertificateTemplate';
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
      // Create a deep copy to avoid modifying the original object directly
      setEditedData(JSON.parse(JSON.stringify(document.extracted_data)));
      console.log("Entering edit mode with data:", JSON.parse(JSON.stringify(document.extracted_data)));
    }
  };

  // Handle data changes from certificate editor
  const handleDataChange = (updatedData: any) => {
    console.log("Data changed in DocumentViewer:", updatedData);
    // Make sure we're replacing the entire editedData object, not just updating properties
    setEditedData(updatedData);
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
    <div className="min-h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold mb-6">{document?.file_name}</h1>
          
          {/* Toggle for hiding original document */}
          {isCertificateOfFitness && document.extracted_data && (
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
        </div>
        
        <div className={`flex-1 px-6 pb-6 flex ${hideOriginal ? 'justify-center' : 'space-x-6'} overflow-auto`}>
          {/* Document Preview */}
          {!hideOriginal && (
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden w-1/2 flex flex-col max-h-full">
              <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                <h2 className="font-medium">Document Preview</h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {fileUrl ? (
                  document.file_name.endsWith('.pdf') ? (
                    <iframe 
                      src={fileUrl} 
                      className="w-full h-full" 
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
            <div className={`bg-white border rounded-lg shadow-sm ${hideOriginal ? 'w-full max-w-4xl' : 'w-1/2'} flex flex-col`}>
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
                <h2 className="font-medium">Certificate of Fitness</h2>
                {editMode ? (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleEditMode}
                      disabled={saving}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      variant="success" 
                      size="sm" 
                      onClick={saveEditedData}
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                      ) : (
                        <Save className="mr-1 h-4 w-4" />
                      )}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={toggleEditMode}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <CertificateTemplate 
                  extractedData={editMode ? editedData : document.extracted_data} 
                  isEditable={editMode}
                  onDataChange={handleDataChange}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden w-1/2">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-medium">Document Details</h2>
              </div>
              <div className="p-4 overflow-auto">
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
      </div>
    </div>
  );
};

export default DocumentViewer;
