import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Calendar, User, Building, Download, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import CertificateTemplate from '@/components/CertificateTemplate';
import DocumentValidationControls from '@/components/documents/DocumentValidationControls';
import type { DatabaseDocument } from '@/types/database';

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DatabaseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'historical'>('modern');
  
  // ADD THIS LINE - Critical for preventing auto-detection override
  const [isManualSelection, setIsManualSelection] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  useEffect(() => {
    if (document?.extracted_data) {
      setValidatedData(document.extracted_data);
    }
  }, [document]);

  // ENHANCED Auto-detection useEffect with debugging and manual selection protection
  useEffect(() => {
    if (document?.extracted_data && !isManualSelection) { // Only auto-detect if not manually selected
      console.log('=== SIGNATURE/STAMP DETECTION DEBUG ===');
      console.log('Full extracted_data:', document.extracted_data);
      
      // Enhanced detection function
      const hasSignatureStampData = (data: any): boolean => {
        const getValue = (obj: any, path: string): any => {
          if (!obj || !path) return null;
          const keys = path.split('.');
          let current = obj;
          for (const key of keys) {
            if (current === undefined || current === null || typeof current !== 'object') {
              return null;
            }
            current = current[key];
          }
          return current;
        };

        // More comprehensive search paths
        const signaturePaths = [
          'signature',
          'structured_data.signature', 
          'extracted_data.signature',
          'certificate_info.signature',
          'structured_data.certificate_info.signature',
          'signature_present',
          'has_signature',
          'signed',
          'doctor_signature',
          'physician_signature'
        ];

        const stampPaths = [
          'stamp',
          'structured_data.stamp',
          'extracted_data.stamp', 
          'certificate_info.stamp',
          'structured_data.certificate_info.stamp',
          'stamp_present',
          'has_stamp',
          'stamped',
          'official_stamp',
          'practice_stamp',
          'date_stamp'
        ];

        console.log('Checking signature paths...');
        let hasSignature = false;
        for (const path of signaturePaths) {
          const value = getValue(data, path);
          console.log(`  ${path}:`, value);
          if (value) {
            hasSignature = true;
            console.log(`  ✓ Found signature data at: ${path}`);
          }
        }

        console.log('Checking stamp paths...');
        let hasStamp = false;
        for (const path of stampPaths) {
          const value = getValue(data, path);
          console.log(`  ${path}:`, value);
          if (value) {
            hasStamp = true;
            console.log(`  ✓ Found stamp data at: ${path}`);
          }
        }

        // Keyword-based detection as fallback
        console.log('Checking for signature/stamp keywords...');
        const dataString = JSON.stringify(data).toLowerCase();
        const signatureKeywords = ['signature', 'dr ', 'doctor', 'physician', 'signed'];
        const stampKeywords = ['stamp', 'practice no', 'practice number', 'sanc no'];
        
        let hasSignatureKeywords = false;
        let hasStampKeywords = false;
        
        for (const keyword of signatureKeywords) {
          if (dataString.includes(keyword)) {
            hasSignatureKeywords = true;
            console.log(`  ✓ Found signature keyword: "${keyword}"`);
            break;
          }
        }
        
        for (const keyword of stampKeywords) {
          if (dataString.includes(keyword)) {
            hasStampKeywords = true;
            console.log(`  ✓ Found stamp keyword: "${keyword}"`);
            break;
          }
        }

        // Medical certificate heuristic - if it has medical certificate structure, likely historical
        const hasMedicalStructure = !!(
          getValue(data, 'structured_data.certificate_info.examination_date') ||
          getValue(data, 'certificate_info.examination_date') ||
          getValue(data, 'structured_data.certificate_info.employee_name') ||
          getValue(data, 'certificate_info.employee_name') ||
          dataString.includes('examination_date') ||
          dataString.includes('practice no') ||
          dataString.includes('sanc no')
        );

        console.log('Detection results:', {
          hasSignature,
          hasStamp, 
          hasSignatureKeywords,
          hasStampKeywords,
          hasMedicalStructure
        });

        // Return true if ANY indicator suggests historical document
        return hasSignature || hasStamp || hasSignatureKeywords || hasStampKeywords || hasMedicalStructure;
      };

      const hasSignatureStamp = hasSignatureStampData(document.extracted_data);
      
      console.log('=== FINAL DETECTION RESULT ===');
      console.log('Has signature/stamp indicators:', hasSignatureStamp);
      
      // CORRECTED LOGIC:
      // Documents with signature/stamp data = Historical documents (filed records)
      // Documents without signature/stamp data = Modern documents (current workflow)
      if (hasSignatureStamp) {
        setSelectedTemplate('historical');
        console.log('✅ Auto-detected: Historical template (found signature/stamp indicators)');
      } else {
        setSelectedTemplate('modern');
        console.log('✅ Auto-detected: Modern template (no signature/stamp indicators)');
      }
      
      console.log('=== END DETECTION DEBUG ===');
    } else if (isManualSelection) {
      console.log('⚡ Skipping auto-detection - user has manually selected template');
    }
  }

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Document not found');
        return;
      }

      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleValidationModeChange = (enabled: boolean) => {
    setIsValidationMode(enabled);
  };

  const handleDataChange = (updatedData: any) => {
    setValidatedData(updatedData);
  };

  const handleValidationComplete = () => {
    toast.success('Patient record created successfully!', {
      action: validatedData?.patient?.name ? {
        label: 'View Patient',
        onClick: () => {
          console.log('Navigate to patient:', validatedData.patient.name);
        }
      } : undefined
    });
    
    fetchDocument();
  };

  const handleDownload = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  const handleTemplateChange = (template: 'modern' | 'historical') => {
    setSelectedTemplate(template);
    setIsManualSelection(true); // Mark as manual selection
    console.log(`🎯 Template manually changed to: ${template}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {error || 'Document not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isProcessed = document.status === 'processed' || document.status === 'completed';
  const isCertificate = document.document_type?.includes('certificate') || 
                        document.file_name?.toLowerCase().includes('certificate');

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{document.file_name} | Document Viewer</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{document.file_name}</h1>
          <p className="text-muted-foreground">
            Uploaded {new Date(document.created_at).toLocaleDateString()}
          </p>
        </div>
        {document.public_url && (
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        )}
      </div>

      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <Badge variant={isProcessed ? 'default' : 'secondary'}>
                {document.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Type</p>
              <p className="text-sm text-muted-foreground">
                {document.document_type || 'Unknown'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Size</p>
              <p className="text-sm text-muted-foreground">
                {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
              </p>
            </div>
          </div>

          {/* Validation Controls - now with template selection */}
          {isProcessed && validatedData && (
            <DocumentValidationControls
              document={document}
              isValidated={!!validatedData}
              validatedData={validatedData}
              onValidationModeChange={handleValidationModeChange}
              onValidationComplete={handleValidationComplete}
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Side-by-side view for certificate validation */}
      {isProcessed && isCertificate && validatedData && isValidationMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Document */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Original Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.public_url ? (
                <div className="w-full">
                  <img 
                    src={document.public_url} 
                    alt={document.file_name}
                    className="w-full h-auto border rounded-lg shadow-sm"
                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground">Original document not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Data Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Extracted Data (Editable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Edit className="h-4 w-4 inline mr-2" />
                  Compare with the original document and edit the extracted data as needed.
                </p>
              </div>
              
              <CertificateTemplate 
                extractedData={validatedData}
                editable={true}
                onDataChange={handleDataChange}
                templateType={selectedTemplate}
              />

              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsValidationMode(false)}
                >
                  Exit Validation Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Certificate Template - regular view mode */}
      {isProcessed && isCertificate && validatedData && !isValidationMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificate Preview ({selectedTemplate === 'modern' ? 'Modern' : 'Historical'} Template)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CertificateTemplate 
              extractedData={validatedData}
              editable={false}
              templateType={selectedTemplate}
            />
          </CardContent>
        </Card>
      )}

      {/* Extracted Data - for non-certificate documents or if no template available */}
      {isProcessed && document.extracted_data && (!isCertificate || !validatedData) && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(document.extracted_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {!isProcessed && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            This document is still being processed. Data extraction and validation features will be available once processing is complete.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}