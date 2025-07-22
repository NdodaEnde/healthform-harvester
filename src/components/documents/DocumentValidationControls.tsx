
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Edit, User, Settings, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import CertificatePromotionDialog from '../certificates/CertificatePromotionDialog';
import { saveValidatedData } from '@/services/documentValidationService';
import { toast } from 'sonner';
import { getEffectiveTemplate } from '@/utils/templateDetection';
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
  selectedTemplate,
  onTemplateChange
}) => {
  const { currentOrganization } = useOrganization();
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ SINGLE SOURCE OF TRUTH - Use shared template detection
  const templateSelection = getEffectiveTemplate(document, selectedTemplate);
  const effectiveTemplate = templateSelection.template;
  const isAutoDetected = templateSelection.source === 'auto-detected';
  const isManualOverride = templateSelection.source === 'manual-override';
  const isSaved = templateSelection.source === 'saved';

  console.log('📋 [DocumentValidationControls] Template selection:', templateSelection);

  // 🔧 ENHANCED: Save function that preserves template selection
  const handleSaveValidatedData = async () => {
    if (!validatedData) {
      toast.error('No validated data to save');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 Saving validated data with template:', effectiveTemplate);
      console.log('💾 Data being saved:', validatedData);
      
      const { error } = await saveValidatedData(document.id, validatedData, effectiveTemplate);
      
      if (error) {
        toast.error('Failed to save validated data: ' + error.message);
      } else {
        toast.success('Validated data saved successfully');
        console.log('💾 Save completed successfully');
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
      console.log('🏥 Opening promotion dialog with validated data:', validatedData);
      setIsPromotionDialogOpen(true);
    }
  };

  // 🔧 FIXED: Simplified promotion complete handler
  const handlePromotionComplete = async () => {
    setIsPromotionDialogOpen(false);
    
    console.log('🎉 Patient record creation completed');
    
    toast.success('Patient record created successfully!');
    
    if (onValidationComplete) {
      setTimeout(() => {
        onValidationComplete();
      }, 1000);
    }
  };

  // 🔧 ENHANCED: Transform function with better data extraction
  const transformDataForPromotion = (data: any) => {
    if (!data) {
      console.warn('⚠️ No data provided to transformDataForPromotion');
      return null;
    }
    
    console.log('🔍 Transforming data for promotion:', data);
    
    // Handle multiple possible data structures
    let patient, certification, examination_results;
    
    // Check if data has structured_data wrapper
    if (data.structured_data) {
      patient = data.structured_data.patient || {};
      certification = data.structured_data.certification || {};
      examination_results = data.structured_data.examination_results || {};
    } else {
      // Direct access to patient data
      patient = data.patient || {};
      certification = data.certification || {};
      examination_results = data.examination_results || {};
    }
    
    // Also check for certificate_info structure (from AI extraction)
    const certificateInfo = data.structured_data?.certificate_info || data.certificate_info;
    if (certificateInfo) {
      console.log('📋 Found certificate_info structure:', certificateInfo);
      
      // Map certificate_info to patient data if patient data is empty
      if (!patient.name && certificateInfo.employee_name) {
        patient.name = certificateInfo.employee_name;
      }
      if (!patient.id_number && certificateInfo.id_number) {
        patient.id_number = certificateInfo.id_number;
      }
      if (!patient.company && certificateInfo.company_name) {
        patient.company = certificateInfo.company_name;
      }
      if (!patient.occupation && certificateInfo.job_title) {
        patient.occupation = certificateInfo.job_title;
      }
    }
    
    console.log('📊 Extracted patient data:', patient);
    console.log('📊 Extracted certification data:', certification);
    console.log('📊 Extracted examination_results data:', examination_results);
    
    // Determine fitness status
    let fitnessStatus = 'unknown';
    if (certification.fit) fitnessStatus = 'fit';
    else if (certification.fit_with_restrictions) fitnessStatus = 'fit_with_restrictions';
    else if (certification.fit_with_condition) fitnessStatus = 'fit_with_condition';
    else if (certification.temporarily_unfit) fitnessStatus = 'temporarily_unfit';
    else if (certification.unfit) fitnessStatus = 'unfit';
    else if (data.fitnessStatus) fitnessStatus = data.fitnessStatus;
    
    // Extract examination date
    const examinationDate = certification.examination_date || 
                           examination_results.date || 
                           certificateInfo?.examination_date ||
                           data.examinationDate || 
                           new Date().toISOString().split('T')[0];
    
    // Extract expiry date
    const expiryDate = certification.valid_until || 
                      certificateInfo?.expiry_date ||
                      certificateInfo?.valid_until ||
                      data.expiryDate;
    
    // Extract examination type
    let examinationType = 'pre-employment';
    if (examination_results.type?.pre_employment) examinationType = 'pre-employment';
    else if (examination_results.type?.periodical) examinationType = 'periodical';
    else if (examination_results.type?.exit) examinationType = 'exit';
    else if (data.examinationType) examinationType = data.examinationType;
    
    const transformedData = {
      patientName: patient.name || certificateInfo?.employee_name || data.patientName || 'Unknown',
      patientId: patient.id_number || patient.employee_id || certificateInfo?.id_number || data.patientId || 'Unknown',
      companyName: patient.company || certificateInfo?.company_name || data.companyName || 'Unknown',
      occupation: patient.occupation || certificateInfo?.job_title || data.occupation || 'Unknown',
      fitnessStatus,
      restrictionsText: data.restrictionsText || 'None',
      examinationDate,
      expiryDate,
      examinationType,
      comments: certification.comments || certificateInfo?.comments || data.comments || '',
      followUpActions: certification.follow_up || certificateInfo?.follow_up || data.followUpActions || ''
    };
    
    console.log('✅ Final transformed data:', transformedData);
    
    return transformedData;
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
              <SelectItem value="historical">
                Historical Certificate
                {templateSelection.detection.template === 'historical' && (
                  <Badge variant="outline" className="ml-2 text-xs text-green-600">Auto</Badge>
                )}
              </SelectItem>
              <SelectItem value="modern">
                Modern Certificate
                {templateSelection.detection.template === 'modern' && (
                  <Badge variant="outline" className="ml-2 text-xs text-green-600">Auto</Badge>
                )}
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Dynamic badge based on source */}
          {isSaved && (
            <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
              Saved Selection
            </Badge>
          )}
          {isAutoDetected && (
            <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
              Auto-detected
            </Badge>
          )}
          {isManualOverride && (
            <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
              Manual Override
            </Badge>
          )}
        </div>

        {/* Template Description */}
        <div className="text-xs text-muted-foreground pl-6">
          {effectiveTemplate === 'historical' 
            ? 'For filed documents with physical signatures and stamps (historical records)'
            : 'For current workflow documents without physical signatures/stamps (digital workflow)'
          }
        </div>

        {/* Enhanced auto-detection explanation */}
        <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border-l-2 border-blue-200">
          <strong>Auto-detection:</strong> {templateSelection.detection.reasoning}
          {templateSelection.detection.confidence > 0 && (
            <span className="ml-2 opacity-75">
              (Confidence: {templateSelection.detection.confidence}%)
            </span>
          )}
        </div>

        {/* Show if template was saved */}
        {isSaved && (
          <div className="text-xs text-muted-foreground p-2 bg-green-50 rounded border-l-2 border-green-200">
            <strong>Saved Selection:</strong> Template choice saved previously
          </div>
        )}
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
