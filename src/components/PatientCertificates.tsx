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
      console.log('=== DOCUMENT STRUCTURE ANALYSIS ===');
      console.log('Patient ID:', patientId);
      console.log('Patient ID Number:', patientData.id_number);
      console.log('Organization ID:', organizationId);
      console.log('Client Organization ID:', clientOrganizationId);

      // Get a few sample documents to analyze their structure
      const { data: sampleDocs, error: sampleError } = await supabase
        .from('documents')
        .select('*')
        .eq('client_organization_id', clientOrganizationId)
        .in('status', ['processed', 'completed'])
        .limit(3)
        .order('created_at', { ascending: false });

      if (sampleError) {
        console.error('Error fetching sample documents:', sampleError);
      } else if (sampleDocs && sampleDocs.length > 0) {
        console.log(`📋 Analyzing structure of ${sampleDocs.length} sample documents:`);
        
        sampleDocs.forEach((doc, index) => {
          console.log(`\n🔍 Document ${index + 1}: ${doc.file_name}`);
          console.log(`📄 Document type: ${doc.document_type}`);
          console.log(`📊 Status: ${doc.status}`);
          
          if (doc.extracted_data) {
            console.log('📦 Full extracted_data structure:');
            console.log(JSON.stringify(doc.extracted_data, null, 2));
            
            // Check for different possible locations of structured data
            console.log('\n🔍 Checking for structured data locations:');
            console.log('- extracted_data.structured_data exists:', !!doc.extracted_data.structured_data);
            console.log('- extracted_data.certificate_info exists:', !!doc.extracted_data.certificate_info);
            console.log('- extracted_data.patient exists:', !!doc.extracted_data.patient);
            console.log('- extracted_data.chunks exists:', !!doc.extracted_data.chunks);
            console.log('- extracted_data.raw_content exists:', !!doc.extracted_data.raw_content);
            
            // If structured_data exists, show its structure
            if (doc.extracted_data.structured_data) {
              console.log('📋 structured_data content:');
              console.log(JSON.stringify(doc.extracted_data.structured_data, null, 2));
            }
            
            // If certificate_info exists, show its structure
            if (doc.extracted_data.certificate_info) {
              console.log('📋 certificate_info content:');
              console.log(JSON.stringify(doc.extracted_data.certificate_info, null, 2));
            }
            
            // Check chunks for content
            if (doc.extracted_data.chunks && Array.isArray(doc.extracted_data.chunks)) {
              console.log(`📄 Found ${doc.extracted_data.chunks.length} chunks`);
              const chunksWithContent = doc.extracted_data.chunks.filter(chunk => chunk.content && chunk.content.trim() !== '');
              console.log(`📄 Chunks with actual content: ${chunksWithContent.length}`);
              
              if (chunksWithContent.length > 0) {
                console.log('📄 Sample content from first chunk:');
                console.log(chunksWithContent[0].content.substring(0, 200) + '...');
              }
            }
          } else {
            console.log('❌ No extracted_data found for this document');
          }
        });
      }

      // For now, just show empty results while we analyze
      setDocuments([]);

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
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientCertificates;
