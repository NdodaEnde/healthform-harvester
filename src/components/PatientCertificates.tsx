
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cleanCertificateData } from '@/utils/certificate-data-cleaner';
import type { DatabasePatient, DatabaseDocument, DatabaseOrganization } from '@/types/database';
import DocumentItem from '@/components/documents/DocumentItem';

interface PatientCertificatesProps {
  patientId: string;
  organizationId: string;
  clientOrganizationId?: string;
}

const PatientCertificates: React.FC<PatientCertificatesProps> = ({ 
  patientId, 
  organizationId, 
  clientOrganizationId 
}) => {
  const [documents, setDocuments] = useState<DatabaseDocument[]>([]);
  const [patient, setPatient] = useState<DatabasePatient | null>(null);
  const [clientOrganization, setClientOrganization] = useState<DatabaseOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data first
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) {
        console.error('Error fetching patient:', patientError);
        toast.error('Failed to load patient information');
        return;
      }

      setPatient(patientData);
      console.log('Patient data loaded:', patientData);

      // Fetch client organization data if available
      if (clientOrganizationId) {
        const { data: clientOrgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', clientOrganizationId)
          .single();

        if (orgError) {
          console.error('Error fetching client organization:', orgError);
        } else {
          setClientOrganization(clientOrgData);
          console.log('Client organization data loaded:', clientOrgData);
        }
      }

      // Now fetch documents for debugging
      console.log('=== ENHANCED DOCUMENT SEARCH ===');
      console.log('Patient ID:', patientId);
      console.log('Patient ID Number:', patientData.id_number);
      console.log('Organization ID:', organizationId);
      console.log('Client Organization ID:', clientOrganizationId);

      // Strategy 1: Look for documents already linked to this patient
      console.log('Strategy 1: Looking for documents with owner_id =', patientId);
      const { data: linkedDocs, error: linkedError } = await supabase
        .from('documents')
        .select('*')
        .eq('owner_id', patientId)
        .in('status', ['processed', 'completed'])
        .order('created_at', { ascending: false });

      if (linkedError) {
        console.error('Error fetching linked documents:', linkedError);
      } else {
        console.log('Found linked documents:', linkedDocs?.length || 0);
        if (linkedDocs && linkedDocs.length > 0) {
          setDocuments(linkedDocs);
          return;
        }
      }

      // Strategy 2: Search through all documents from both organizations
      console.log('Strategy 2: Searching all documents from both organizations');
      
      let allDocs: DatabaseDocument[] = [];
      
      // Get documents from client organization
      if (clientOrganizationId) {
        const { data: clientDocs, error: clientError } = await supabase
          .from('documents')
          .select('*')
          .eq('client_organization_id', clientOrganizationId)
          .in('status', ['processed', 'completed'])
          .order('created_at', { ascending: false });

        if (clientError) {
          console.error('Error fetching client documents:', clientError);
        } else {
          console.log('Found client organization documents:', clientDocs?.length || 0);
          allDocs = [...allDocs, ...(clientDocs || [])];
        }
      }

      // Search through documents for patient ID
      if (patientData.id_number && allDocs.length > 0) {
        console.log('🔍 Starting detailed search through client documents...');
        
        const matchingDocs: DatabaseDocument[] = [];
        const searchId = patientData.id_number.replace(/\s/g, ''); // Remove spaces for comparison
        
        // Take a sample for detailed logging
        const sampleDocs = allDocs.slice(0, 5);
        
        for (const doc of sampleDocs) {
          console.log(`🔍 Searching document ${doc.id} (${doc.file_name})`);
          console.log(`📄 Document type: ${doc.document_type}`);
          console.log(`🆔 Looking for ID: ${searchId}`);
          
          if (doc.extracted_data) {
            const extractedData = doc.extracted_data as any;
            
            // Show the structure analysis
            console.log('🔍 Checking for structured data locations:');
            console.log('- extracted_data.structured_data exists:', !!extractedData.structured_data);
            console.log('- extracted_data.certificate_info exists:', !!extractedData.certificate_info);
            console.log('- extracted_data.patient exists:', !!extractedData.patient);
            console.log('- extracted_data.chunks exists:', !!extractedData.chunks);
            console.log('- extracted_data.raw_content exists:', !!extractedData.raw_content);
            
            // Show structured_data content if it exists
            if (extractedData.structured_data) {
              console.log('📋 structured_data content:');
              console.log(JSON.stringify(extractedData.structured_data, null, 2));
            }
            
            // Show certificate_info content if it exists
            if (extractedData.certificate_info) {
              console.log('📋 certificate_info content:');
              console.log(JSON.stringify(extractedData.certificate_info, null, 2));
            }
            
            // Check chunks
            if (extractedData.chunks && Array.isArray(extractedData.chunks)) {
              console.log(`📄 Found ${extractedData.chunks.length} chunks`);
              const chunksWithContent = extractedData.chunks.filter((chunk: any) => chunk.content && chunk.content.trim() !== '');
              console.log(`📄 Chunks with actual content: ${chunksWithContent.length}`);
              
              if (chunksWithContent.length > 0) {
                console.log('📄 Sample content from first chunk:');
                console.log(chunksWithContent[0].content.substring(0, 200) + '...');
              }
            }
            
            // Now check if we can find the ID anywhere
            const extractedDataStr = JSON.stringify(extractedData).toLowerCase();
            const idVariations = [
              searchId,
              searchId.replace(/(\d{6})(\d{7})/, '$1 $2'), // Add space in middle
              searchId.replace(/(\d{2})(\d{2})(\d{2})(\d{7})/, '$1 $2 $3 $4'), // Full formatting
            ];
            
            let foundMatch = false;
            for (const idVariation of idVariations) {
              if (extractedDataStr.includes(idVariation.toLowerCase())) {
                console.log(`✅ Found match for ID variation: ${idVariation}`);
                matchingDocs.push(doc);
                foundMatch = true;
                break;
              }
            }
            
            if (!foundMatch) {
              console.log(`❌ No match found. Sample data: ${extractedDataStr.substring(0, 200)}...`);
            }
          } else {
            console.log('❌ No extracted_data found for this document');
          }
        }
        
        console.log(`🎯 Total matching documents found: ${matchingDocs.length}`);
        setDocuments(matchingDocs);
      } else {
        console.log('⚠️ No patient ID number or no documents to search');
        setDocuments([]);
      }

    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId && organizationId) {
      fetchData();
    }
  }, [patientId, organizationId, clientOrganizationId]);

  const handleDownload = async (doc: DatabaseDocument) => {
    try {
      if (!doc.file_path) {
        toast.error('File path not available');
        return;
      }

      const { data, error } = await supabase.storage
        .from('medical-documents')
        .download(doc.file_path);

      if (error) {
        console.error('Download error:', error);
        toast.error('Failed to download document');
        return;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = doc.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Download started');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const handleView = (doc: DatabaseDocument) => {
    window.open(`/documents/${doc.id}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Certificates - Debug Mode
          </CardTitle>
          <CardDescription>
            Analyzing document structure for {patient?.first_name} {patient?.last_name}
            {clientOrganization && ` from ${clientOrganization.name}`}
            <br />
            <strong>Check the browser console for detailed document structure analysis</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onView={handleView}
                  onDownload={handleDownload}
                  showCertificateInfo={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Debug Mode Active</h3>
              <p className="text-muted-foreground">
                Please check the browser console to see the detailed analysis of document structures.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Patient: {patient?.first_name} {patient?.last_name} (ID: {patient?.id_number})
              </p>
              <p className="text-xs text-muted-foreground">
                Looking for documents in: {clientOrganization?.name || 'Unknown Organization'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientCertificates;
