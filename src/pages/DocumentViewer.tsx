import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DocumentHeader from '@/components/DocumentHeader';
import { Helmet } from 'react-helmet';
import EditableCertificateTemplate from '@/components/certificates/EditableCertificateTemplate';
import EnhancedCertificateGenerator from '@/components/certificates/EnhancedCertificateGenerator';

const DocumentViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{field: string; message: string}>>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    fetchDocument(id);
  }, [id]);

  const fetchDocument = async (documentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setDocument(data);
        
        // Try to find a patient that might be associated with this document
        if (data.extracted_data?.certificate_info?.id_number) {
          findPatientByIdNumber(data.extracted_data.certificate_info.id_number, data.organization_id);
        } else if (data.extracted_data?.structured_data?.certificate_info?.id_number) {
          findPatientByIdNumber(data.extracted_data.structured_data.certificate_info.id_number, data.organization_id);
        }
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const findPatientByIdNumber = async (idNumber: string, orgId: string) => {
    if (!idNumber || !orgId) return;
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('id_number', idNumber)
        .eq('organization_id', orgId)
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPatientId(data[0].id);
      }
    } catch (err) {
      console.error('Error finding patient:', err);
      // Non-blocking error, don't show to user
    }
  };

  const handleDataChange = (field: string, value: any) => {
    if (!editedData) {
      // Initialize with the original data if this is the first edit
      setEditedData({
        ...document.extracted_data
      });
    }
    
    // Deep update the nested field
    setEditedData(prev => {
      const newData = { ...prev };
      
      // Handle nested paths (e.g., "certificate_info.employee_name")
      const parts = field.split('.');
      let current = newData;
      
      // Navigate to the deepest level
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      // Set the value at the deepest level
      current[parts[parts.length - 1]] = value;
      return newData;
    });
  };

  const validateData = () => {
    const errors = [];
    
    // Example validation - in a real app, this would be more comprehensive
    if (editedData?.certificate_info?.employee_name === '') {
      errors.push({ field: 'employee_name', message: 'Employee name is required' });
    }
    
    if (editedData?.certificate_info?.id_number && 
        editedData.certificate_info.id_number.length !== 13) {
      errors.push({ field: 'id_number', message: 'ID number should be 13 digits' });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const saveChanges = async () => {
    if (!validateData()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted errors before saving.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('documents')
        .update({ extracted_data: editedData })
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Changes saved",
        description: "Document data has been updated successfully.",
      });
      
      // Refresh the document
      fetchDocument(id!);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving changes:', err);
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !document) {
    return (
      <div className="container mx-auto p-4">
        <Helmet>
          <title>Loading Document...</title>
        </Helmet>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Helmet>
          <title>Error</title>
        </Helmet>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Document</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => fetchDocument(id!)}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Helmet>
        <title>{document?.file_name || 'Document Viewer'}</title>
      </Helmet>
      
      <DocumentHeader
        document={document}
        onRefresh={() => fetchDocument(id!)}
      />
      
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
            <TabsTrigger value="data">Extracted Data</TabsTrigger>
            <TabsTrigger value="certificate">Certificate</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="h-[calc(100vh-250px)] overflow-auto">
            {document?.public_url ? (
              <iframe 
                src={document.public_url} 
                className="w-full h-full border-0"
                title="Document Preview"
              />
            ) : (
              <Card>
                <CardContent className="p-4">
                  <p className="text-center text-gray-500">No preview available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Extracted Data</CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="edit-mode"
                    checked={isEditing}
                    onCheckedChange={(checked) => setIsEditing(!!checked)}
                  />
                  <label htmlFor="edit-mode" className="text-sm cursor-pointer">
                    Edit Mode
                  </label>
                  {isEditing && (
                    <Button onClick={saveChanges} disabled={loading} size="sm">
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {document?.extracted_data && document.id && (
                  <EditableCertificateTemplate 
                    extractedData={isEditing ? editedData : document.extracted_data} 
                    documentId={document.id}
                    editable={isEditing}
                    onDataChange={handleDataChange}
                    validationErrors={validationErrors}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="certificate">
            <Card>
              <CardContent className="p-6">
                <EnhancedCertificateGenerator 
                  documentId={document?.id}
                  patientId={patientId}
                  document={document}
                  onGenerate={async () => {
                    // Placeholder for certificate generation functionality
                    console.log("Certificate generation would happen here");
                    return Promise.resolve();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Raw Document Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded overflow-auto h-[calc(100vh-400px)] text-xs">
                  {JSON.stringify(document, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DocumentViewer;
