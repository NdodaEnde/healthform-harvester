import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Calendar, User, Building, Download, Edit, ExternalLink } from 'lucide-react';
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
  
  // Use refs to track state and prevent conflicts
  const isManualSelection = useRef(false);
  const hasAutoDetected = useRef(false);
  const documentId = useRef<string | null>(null);
  const autoDetectionRan = useRef(false);
  const initialTemplateSet = useRef(false); // NEW: Track if initial template has been set

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

  // Reset refs when document changes
  useEffect(() => {
    if (document && document.id !== documentId.current) {
      console.log('🔄 Document changed, resetting template selection state');
      documentId.current = document.id;
      isManualSelection.current = false;
      hasAutoDetected.current = false;
      autoDetectionRan.current = false;
      initialTemplateSet.current = false; // NEW: Reset initial template flag
    }
  }, [document?.id]);

  // Auto-detection useEffect with better guards
  useEffect(() => {
    // MODIFIED: Don't run auto-detection if initial template has already been set
    if (!document?.extracted_data || 
        isManualSelection.current || 
        hasAutoDetected.current || 
        autoDetectionRan.current ||
        initialTemplateSet.current) {
      
      if (isManualSelection.current) {
        console.log('⚡ Skipping auto-detection - user has manually selected template');
      } else if (hasAutoDetected.current || autoDetectionRan.current) {
        console.log('⚡ Skipping auto-detection - already completed for this document');
      } else if (initialTemplateSet.current) {
        console.log('⚡ Skipping auto-detection - initial template already set');
      }
      return;
    }

    console.log('=== SIGNATURE/STAMP AUTO-DETECTION ===');
    console.log('Full extracted_data:', document.extracted_data);

    const structuredData = document.extracted_data.structured_data;
    const certificateInfo = structuredData?.certificate_info;
    const rawContent = document.extracted_data.raw_content || '';

    console.log('Certificate info:', certificateInfo);
    console.log('Raw content sample:', rawContent.substring(0, 200));

    let hasSignature = false;
    let hasStamp = false;
    
    // Check explicit boolean flags from Edge Function
    if (certificateInfo?.signature === true) {
      hasSignature = true;
      console.log('✅ Signature detected from Edge Function boolean flag');
    }
    
    if (certificateInfo?.stamp === true) {
      hasStamp = true;
      console.log('✅ Stamp detected from Edge Function boolean flag');
    }
    
    // Fallback to enhanced content analysis if flags not set
    if (!hasSignature || !hasStamp) {
      console.log('Using fallback content analysis...');
      
      const contentLower = rawContent.toLowerCase();
      
      if (!hasSignature) {
        const signatureKeywords = [
          'signature:',
          'handwritten signature',
          'stylized flourish',
          'placed above the printed word "signature"',
          'overlapping strokes',
          'signature consists of',
          'tall, looping, and angular strokes',
          'handwriting & style',
          'multiple overlapping lines',
          'horizontal flourish'
        ];
        
        hasSignature = signatureKeywords.some(keyword => contentLower.includes(keyword));
        if (hasSignature) {
          console.log('✅ Signature detected from enhanced raw content analysis');
        }
      }
      
      if (!hasStamp) {
        const stampKeywords = [
          'stamp:',
          'rectangular black stamp',
          'practice no',
          'practice number',
          'practice no.',
          'practice no:',
          'sanc no',
          'sanc number',
          'sasohn no',
          'mp no',
          'mp number',
          'black stamp',
          'official stamp',
          'hpcsa',
          'with partial text and date'
        ];
        
        hasStamp = stampKeywords.some(keyword => contentLower.includes(keyword));
        if (hasStamp) {
          console.log('✅ Stamp detected from enhanced raw content analysis');
        }
      }
    }
    
    const hasSignatureStampData = hasSignature || hasStamp;

    const detectionResult = {
      hasSignature,
      hasStamp,
      hasSignatureStampData,
      detectedTemplate: hasSignatureStampData ? 'historical' : 'modern',
      reasoning: hasSignatureStampData 
        ? `Found ${hasSignature ? 'signature' : ''}${hasSignature && hasStamp ? ' and ' : ''}${hasStamp ? 'stamp' : ''} → Historical template (filed record)` 
        : 'No signature/stamp data → Modern template (current workflow)'
    };

    console.log('Enhanced template detection:', detectionResult);

    const detectedTemplate = hasSignatureStampData ? 'historical' : 'modern';
    setSelectedTemplate(detectedTemplate);
    
    console.log(`✅ Auto-detected: ${detectedTemplate} template (${detectionResult.reasoning})`);
    
    hasAutoDetected.current = true;
    autoDetectionRan.current = true;
    initialTemplateSet.current = true; // NEW: Mark that initial template has been set
    console.log('=== END AUTO-DETECTION ===');
  }, [document?.extracted_data]);

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
    toast.success('Validation completed successfully!', {
      action: validatedData?.patient?.name ? {
        label: 'View Patient',
        onClick: () => {
          console.log('Navigate to patient:', validatedData.patient.name);
        }
      } : undefined
    });
    
    // Refresh the document to show updated data
    fetchDocument();
  };

  const handleDownload = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  const handleTemplateChange = useCallback((template: 'modern' | 'historical') => {
    console.log(`🎯 Template manually changed to: ${template}`);
    console.log('Previous template:', selectedTemplate);
    console.log('Manual selection flag before:', isManualSelection.current);
    
    isManualSelection.current = true;
    initialTemplateSet.current = true; // NEW: Prevent auto-detection from overriding
    setSelectedTemplate(template);
    
    console.log('Manual selection flag set to true - auto-detection will be permanently disabled');
    console.log('Template should now be:', template);
  }, [selectedTemplate]);

  // Helper function to determine if document is a PDF
  const isPDF = (document: DatabaseDocument) => {
    return document.mime_type === 'application/pdf' || 
           document.file_name?.toLowerCase().endsWith('.pdf');
  };

  // Helper function to determine if document is an image
  const isImage = (document: DatabaseDocument) => {
    return document.mime_type?.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(document.file_name || '');
  };

  // Render original document viewer
  const renderOriginalDocument = () => {
    if (!document?.public_url) {
      return (
        <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
          <p className="text-muted-foreground">Original document not available</p>
        </div>
      );
    }

    if (isPDF(document)) {
      return (
        <div className="w-full space-y-4">
          {/* PDF Embed */}
          <div className="w-full border rounded-lg overflow-hidden shadow-sm">
            <iframe
              src={`${document.public_url}#view=FitH`}
              className="w-full h-96 border-0"
              title={`PDF: ${document.file_name}`}
              loading="lazy"
            />
          </div>
          
          {/* Fallback options */}
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(document.public_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          
          {/* Additional note for users */}
          <div className="text-xs text-muted-foreground text-center p-2 bg-blue-50 rounded">
            💡 If the PDF doesn't display properly, try opening it in a new tab or downloading it
          </div>
        </div>
      );
    } else if (isImage(document)) {
      return (
        <div className="w-full">
          <img 
            src={document.public_url} 
            alt={document.file_name}
            className="w-full h-auto border rounded-lg shadow-sm max-h-96 object-contain"
            onError={(e) => {
              console.error('Image failed to load:', document.public_url);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center justify-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Failed to load image</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(document.public_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original
              </Button>
            </div>
          </div>
        </div>
      );
    } else {
      // Unknown file type
      return (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg space-y-3">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Document preview not available for this file type
            <br />
            <span className="text-xs">({document.mime_type || 'Unknown type'})</span>
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(document.public_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Original
          </Button>
        </div>
      );
    }
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
          <p className="text-muted-foreground mt-1">
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

          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && isProcessed && validatedData && (
            <div className="p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug:</strong></p>
              <p>Manual selection: {isManualSelection.current ? 'Yes' : 'No'}</p>
              <p>Auto-detected: {hasAutoDetected.current ? 'Yes' : 'No'}</p>
              <p>Auto-detection ran: {autoDetectionRan.current ? 'Yes' : 'No'}</p>
              <p>Initial template set: {initialTemplateSet.current ? 'Yes' : 'No'}</p>
              <p>Selected template: {selectedTemplate}</p>
              <p>File type: {document.mime_type}</p>
              <p>Is PDF: {isPDF(document) ? 'Yes' : 'No'}</p>
              <p>Is Image: {isImage(document) ? 'Yes' : 'No'}</p>
            </div>
          )}

          {/* Validation Controls */}
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
                {isPDF(document) && (
                  <Badge variant="outline" className="ml-2">PDF</Badge>
                )}
                {isImage(document) && (
                  <Badge variant="outline" className="ml-2">Image</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderOriginalDocument()}
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
