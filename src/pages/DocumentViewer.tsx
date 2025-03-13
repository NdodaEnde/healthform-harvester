
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/Sidebar';

// Basic document viewer component
const DocumentViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

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
        if (data.storage_path) {
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from('medical-documents')
            .createSignedUrl(data.storage_path, 3600); // 1 hour expiry

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="container py-10">
          <h1 className="text-2xl font-bold mb-6">{document.file_name}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
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
            
            {/* Document Details */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
