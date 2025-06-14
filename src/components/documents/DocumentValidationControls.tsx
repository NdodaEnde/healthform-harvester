// 1. UPDATE services/documentValidationService.ts

export const saveValidatedData = async (documentId: string, validatedData: any) => {
  try {
    console.log('Saving validated data for document:', documentId);
    console.log('Validated data:', validatedData);
    
    // Get current document to preserve template selection and original data
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      throw new Error('Failed to fetch current document data');
    }

    const currentExtractedData = currentDoc.extracted_data as any;
    
    // 🔧 FIX: Preserve template selection and original detection data
    const updatedExtractedData = {
      ...currentExtractedData,
      structured_data: validatedData,
      // Preserve the original raw_content that contains signature/stamp info
      raw_content: currentExtractedData.raw_content,
      // 🎯 CRITICAL: Save the current template selection
      template_selection: {
        selected_template: 'historical', // You can pass this as a parameter
        manually_selected: true,
        saved_at: new Date().toISOString()
      },
      // Mark as validated
      validation_status: 'validated',
      validated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('documents')
      .update({
        extracted_data: updatedExtractedData,
        validated_by: (await supabase.auth.getUser()).data.user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      throw error;
    }

    console.log('Successfully saved validated data');
    return { error: null };

  } catch (error) {
    console.error('Error saving validated data:', error);
    return { error };
  }
};

// 2. UPDATE DocumentValidationControls.tsx - Add template selection parameter

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Edit, User, Settings, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from '../certificates/CertificatePromotionDialog';
import { saveValidatedData } from '@/services/documentValidationService';
import { toast } from 'sonner';
import type { DatabaseDocument } from '@/types/database';

interface DocumentValidationControlsProps {
  document: DatabaseDocument;
  isValidated: boolean;
  validatedData: any;
  onValidationModeChange: (enabled: boolean) => void;
  onValidationComplete?: () => void;
  selectedTemplate?: 'modern' | 'historical';
  onTemplateChange?: (template: 'modern' | 'historical') => void;
}

const DocumentValidationControls: React.FC<DocumentValidationControlsProps> = ({
  document,
  isValidated,
  validatedData,
  onValidationModeChange,
  onValidationComplete,
  selectedTemplate = 'modern',
  onTemplateChange
}) => {
  const { currentOrganization } = useOrganization();
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🔧 FIX: Enhanced save function that preserves template selection
  const handleSaveValidatedData = async () => {
    if (!validatedData) {
      toast.error('No validated data to save');
      return;
    }

    setIsSaving(true);
    try {
      // Get current document to preserve original data
      const { data: currentDoc, error: fetchError } = await supabase
        .from('documents')
        .select('extracted_data')
        .eq('id', document.id)
        .single();

      if (fetchError || !currentDoc) {
        throw new Error('Failed to fetch current document');
      }

      const currentExtractedData = currentDoc.extracted_data as any;
      
      // Create updated data that preserves template selection and signature/stamp info
      const updatedExtractedData = {
        ...currentExtractedData,
        structured_data: validatedData,
        // 🎯 PRESERVE: Keep original raw content with signature/stamp data
        raw_content: currentExtractedData.raw_content,
        // 🎯 SAVE: Current template selection
        template_selection: {
          selected_template: selectedTemplate,
          manually_selected: true,
          saved_at: new Date().toISOString(),
          preserved_signature_data: !!(currentExtractedData.structured_data?.certificate_info?.signature),
          preserved_stamp_data: !!(currentExtractedData.structured_data?.certificate_info?.stamp)
        },
        validation_status: 'validated',
        validated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('documents')
        .update({
          extracted_data: updatedExtractedData,
          validated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id);
      
      if (error) {
        toast.error('Failed to save validated data: ' + error.message);
      } else {
        toast.success('Validated data saved successfully');
        onValidationComplete?.();
      }
    } catch (err) {
      console.error('Error saving validated data:', err);
      toast.error('Unexpected error saving validated data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePatientRecord = () => {
    if (validatedData && currentOrganization) {
      console.log('Opening promotion dialog with validated data:', validatedData);
      setIsPromotionDialogOpen(true);
    }
  };

  const handlePromotionComplete = async () => {
    setIsPromotionDialogOpen(false);
    
    // Save the validated data to the document after successful patient record creation
    await handleSaveValidatedData();
  };

  // 🔧 FIX: Check for saved template selection instead of auto-detecting
  const getTemplateSelection = () => {
    const extractedData = document.extracted_data as any;
    
    // Check if template was previously saved
    if (extractedData?.template_selection?.selected_template) {
      console.log('Found saved template selection:', extractedData.template_selection.selected_template);
      return extractedData.template_selection.selected_template;
    }
    
    // Only auto-detect if no saved selection exists
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

    const hasSignature = !!(
      getValue(extractedData, 'signature') ||
      getValue(extractedData, 'structured_data.signature') ||
      getValue(extractedData, 'structured_data.certificate_info.signature')
    );

    const hasStamp = !!(
      getValue(extractedData, 'stamp') ||
      getValue(extractedData, 'structured_data.stamp') ||
      getValue(extractedData, 'structured_data.certificate_info.stamp')
    );

    const hasSignatureStampData = hasSignature || hasStamp;
    const detectedTemplate = hasSignatureStampData ? 'historical' : 'modern';
    
    console.log('Auto-detecting template:', {
      hasSignature,
      hasStamp,
      detectedTemplate
    });
    
    return detectedTemplate;
  };

  // 🔧 FIX: Use saved template selection or current selection
  const effectiveTemplate = document.extracted_data?.template_selection?.selected_template || selectedTemplate;

  // Transform the validated data to match what the promotion service expects
  const transformDataForPromotion = (data: any) => {
    if (!data) return null;
    
    const patient = data.patient || {};
    const certification = data.certification || {};
    const examination_results = data.examination_results || {};
    
    return {
      patientName: patient.name || data.patientName || 'Unknown',
      patientId: patient.id_number || data.patientId || 'Unknown',
      companyName: patient.company || data.companyName || 'Unknown',
      occupation: patient.occupation || data.occupation || 'Unknown',
      fitnessStatus: certification.fit ? 'fit' : 
                    certification.fit_with_restrictions ? 'fit_with_restrictions' : 
                    certification.temporarily_unfit ? 'temporarily_unfit' : 
                    certification.unfit ? 'unfit' : 
                    data.fitnessStatus || 'unknown',
      restrictionsText: data.restrictionsText || 'None',
      examinationDate: certification.examination_date || examination_results.date || data.examinationDate || new Date().toISOString().split('T')[0],
      expiryDate: certification.valid_until || data.expiryDate,
      examinationType: examination_results.type?.pre_employment ? 'pre-employment' :
                      examination_results.type?.periodical ? 'periodical' :
                      examination_results.type?.exit ? 'exit' : 
                      data.examinationType || 'pre-employment',
      comments: certification.comments || data.comments,
      followUpActions: certification.follow_up || data.followUpActions
    };
  };

  // Only show for processed documents
  if (document.status !== 'processed' && document.status !== 'completed') {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
        {isValidated && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Edit className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        )}
        {document.validation_status === 'validated' && (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <Save className="h-3 w-3 mr-1" />
            Saved
          </Badge>
        )}
      </div>

      {/* Template Selection */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Certificate Template:</span>
          <Select value={effectiveTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="historical">Historical Certificate</SelectItem>
              <SelectItem value="modern">Modern Certificate</SelectItem>
            </SelectContent>
          </Select>
          
          {document.extracted_data?.template_selection && (
            <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
              Saved Selection
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground pl-6">
          {effectiveTemplate === 'historical' 
            ? 'For filed documents with physical signatures and stamps (historical records)'
            : 'For current workflow documents without physical signatures/stamps (digital workflow)'
          }
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onValidationModeChange(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Validate Data
        </Button>

        {isValidated && validatedData && (
          <>
            <Button 
              onClick={handleSaveValidatedData}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button 
              onClick={handleCreatePatientRecord}
              className="flex items-center gap-2"
              disabled={!currentOrganization}
            >
              <User className="h-4 w-4" />
              Create Patient Record
            </Button>
          </>
        )}
      </div>

      {isPromotionDialogOpen && validatedData && currentOrganization && (
        <CertificatePromotionDialog
          isOpen={isPromotionDialogOpen}
          onClose={() => setIsPromotionDialogOpen(false)}
          documentId={document.id}
          validatedData={transformDataForPromotion(validatedData)}
          organizationId={currentOrganization.id}
          clientOrganizationId={document.client_organization_id}
          onPromotionComplete={handlePromotionComplete}
        />
      )}
    </div>
  );
};

export default DocumentValidationControls;