import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, FileText, Calendar, User, Building, Download, Edit, Save, CheckCircle, AlertTriangle, X, History } from 'lucide-react';
import { toast } from 'sonner';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import CertificateTemplate from '@/components/CertificateTemplate';
import DocumentValidationControls from '@/components/documents/DocumentValidationControls';
import type { DatabaseDocument } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

interface ValidationHistoryEntry {
  timestamp: string;
  changes: any;
  validated_by: string;
  validation_type: 'auto' | 'manual' | 'correction';
  notes?: string;
}

interface EnhancedExtractedData {
  raw_content: string;
  structured_data: any;
  processing_info: any;
  validation_history?: ValidationHistoryEntry[];
  last_validated_at?: string;
  last_validated_by?: string;
  validation_status: 'pending' | 'in_progress' | 'validated' | 'needs_review';
}

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Document state
  const [document, setDocument] = useState<DatabaseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Validation state
  const [isValidationMode, setIsValidationMode] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showValidationHistory, setShowValidationHistory] = useState(false);
  
  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'historical'>('modern');
  
  // Refs for auto-detection
  const isManualSelection = useRef(false);
  const hasAutoDetected = useRef(false);
  const documentId = useRef<string | null>(null);
  const autoDetectionRan = useRef(false);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  useEffect(() => {
    if (document?.extracted_data) {
      const extractedData = document.extracted_data as EnhancedExtractedData;
      setValidatedData(extractedData);
      setOriginalData(JSON.parse(JSON.stringify(extractedData))); // Deep copy
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
      setHasUnsavedChanges(false);
    }
  }, [document?.id]);

  // Auto-detection for template selection
  useEffect(() => {
    if (!document?.extracted_data || 
        isManualSelection.current || 
        hasAutoDetected.current || 
        autoDetectionRan.current) {
      return;
    }

    console.log('=== SIGNATURE/STAMP AUTO-DETECTION ===');
    
    const structuredData = document.extracted_data.structured_data;
    const certificateInfo = structuredData?.certificate_info;
    const rawContent = document.extracted_data.raw_content || '';

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
    
    // Fallback to enhanced content analysis
    if (!hasSignature || !hasStamp) {
      const contentLower = rawContent.toLowerCase();
      
      if (!hasSignature) {
        const signatureKeywords = [
          'signature:', 'handwritten signature', 'stylized flourish',
          'placed above the printed word "signature"', 'overlapping strokes',
          'signature consists of', 'tall, looping, and angular strokes',
          'handwriting & style', 'multiple overlapping lines', 'horizontal flourish'
        ];
        
        hasSignature = signatureKeywords.some(keyword => contentLower.includes(keyword));
      }
      
      if (!hasStamp) {
        const stampKeywords = [
          'stamp:', 'rectangular black stamp', 'practice no', 'practice number',
          'practice no.', 'practice no:', 'sanc no', 'sanc number', 'sasohn no',
          'mp no', 'mp number', 'black stamp', 'official stamp', 'hpcsa',
          'with partial text and date'
        ];
        
        hasStamp = stampKeywords.some(keyword => contentLower.includes(keyword));
      }
    }
    
    const hasSignatureStampData = hasSignature || hasStamp;
    const detectedTemplate = hasSignatureStampData ? 'historical' : 'modern';
    
    setSelectedTemplate(detectedTemplate);
    hasAutoDetected.current = true;
    autoDetectionRan.current = true;
    
    console.log(`✅ Auto-detected: ${detectedTemplate} template`);
    console.log('=== END AUTO-DETECTION ===');
  }, [document?.extracted_data]);

  // Prevent data loss on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    if (enabled) {
      setIsValidationMode(true);
      // Set validation status to in_progress when entering validation mode
      if (document?.extracted_data) {
        const updatedData = {
          ...document.extracted_data,
          validation_status: 'in_progress' as const
        };
        setValidatedData(updatedData);
      }
    } else {
      if (hasUnsavedChanges) {
        setShowExitConfirmation(true);
      } else {
        exitValidationMode();
      }
    }
  };

  const exitValidationMode = () => {
    setIsValidationMode(false);
    setHasUnsavedChanges(false);
    setShowExitConfirmation(false);
    
    // Reset to original data
    if (originalData) {
      setValidatedData(JSON.parse(JSON.stringify(originalData)));
    }
  };

  const handleDataChange = useCallback((updatedData: any) => {
    setValidatedData(updatedData);
    setHasUnsavedChanges(true);
  }, []);

  const createValidationHistoryEntry = (type: 'auto' | 'manual' | 'correction', notes?: string): ValidationHistoryEntry => {
    return {
      timestamp: new Date().toISOString(),
      changes: validatedData,
      validated_by: user?.id || 'unknown',
      validation_type: type,
      notes
    };
  };

  const handleSaveChanges = async (isCompletingValidation = false) => {
    if (!document || !validatedData) return false;
    
    try {
      setIsSaving(true);
      
      const currentExtractedData = document.extracted_data as EnhancedExtractedData;
      
      // Create new validation history entry
      const newHistoryEntry = createValidationHistoryEntry(
        isCompletingValidation ? 'manual' : 'correction',
        isCompletingValidation ? 'Validation completed' : 'Data updated during validation'
      );
      
      // Create updated extracted data structure
      const updatedExtractedData: EnhancedExtractedData = {
        ...currentExtractedData,
        structured_data: validatedData.structured_data || validatedData,
        validation_history: [
          ...(currentExtractedData.validation_history || []),
          newHistoryEntry
        ],
        last_validated_at: new Date().toISOString(),
        last_validated_by: user?.id || 'unknown',
        validation_status: isCompletingValidation ? 'validated' : 'in_progress'
      };

      const { error } = await supabase
        .from('documents')
        .update({
          extracted_data: updatedExtractedData,
          status: isCompletingValidation ? 'validated' : document.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);

      if (error) {
        console.error('Error saving validated data:', error);
        toast.error('Failed to save changes: ' + error.message);
        return false;
      }

      const successMessage = isCompletingValidation 
        ? 'Validation completed successfully!' 
        : 'Changes saved successfully!';
      
      toast.success(successMessage);
      setHasUnsavedChanges(false);
      
      // Update original data reference
      setOriginalData(JSON.parse(JSON.stringify(updatedExtractedData)));
      
      // Refresh document data
      await fetchDocument();
      
      return true;
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidationComplete = async () => {
    const saveSuccess = await handleSaveChanges(true);
    
    if (saveSuccess) {
      // Exit validation mode
      setIsValidationMode(false);
      setHasUnsavedChanges(false);
      
      // Show success message with optional patient navigation
      toast.success('Document validation completed!', {
        action: validatedData?.patient?.name ? {
          label: 'View Patient',
          onClick: () => {
            // Navigate to patient record if applicable
            console.log('Navigate to patient:', validatedData.patient.name);
          }
        } : undefined
      });
    }
  };

  const handleTemplateChange = useCallback((template: 'modern' | 'historical') => {
    console.log(`🎯 Template manually changed to: ${template}`);
    isManualSelection.current = true;
    setSelectedTemplate(template);
  }, []);

  const handleDownload = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending Validation</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">Validated</Badge>;
      case 'needs_review':
        return <Badge variant="destructive">Needs Review</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  const getValidationHistory = (): ValidationHistoryEntry[] => {
    const extractedData = document?.extracted_data as EnhancedExtractedData;
    return extractedData?.validation_history || [];
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

  const isProcessed = document.status === 'processed' || document.status === 'completed' || document.status === 'validated';
  const isCertificate = document.document_type?.includes('certificate') || 
                        document.file_name?.toLowerCase().includes('certificate');
  
  const extractedData = document.extracted_data as EnhancedExtractedData;
  const validationHistory = getValidationHistory();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{document.file_name} | Document Viewer</title>
      </Helmet>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you exit validation mode now, your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExitConfirmation(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleSaveChanges(false)}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="destructive" onClick={exitValidationMode}>
              Exit Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation History Dialog */}
      <Dialog open={showValidationHistory} onOpenChange={setShowValidationHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Validation History
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-4">
            {validationHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No validation history available</p>
            ) : (
              validationHistory.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.validation_type === 'manual' ? 'default' : 'secondary'}>
                        {entry.validation_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {entry.notes && (
                    <p className="text-sm">{entry.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
        <div className="flex items-center gap-2">
          {validationHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowValidationHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              History ({validationHistory.length})
            </Button>
          )}
          {document.public_url && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Validation Status Bar */}
      {isValidationMode && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Validation Mode</span>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-orange-600 font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => handleSaveChanges(false)}
              disabled={!hasUnsavedChanges || isSaving}
              variant="outline"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              onClick={handleValidationComplete}
              disabled={isSaving}
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Validation
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleValidationModeChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Validation Status</p>
              {getValidationStatusBadge(extractedData?.validation_status || 'pending')}
            </div>
          </div>

          {/* Last validation info */}
          {extractedData?.last_validated_at && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last validated: {new Date(extractedData.last_validated_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Validation Controls */}
          {isProcessed && validatedData && (
            <DocumentValidationControls
              document={document}
              isValidated={extractedData?.validation_status === 'validated'}
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
            <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
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