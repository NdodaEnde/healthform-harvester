import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Edit, 
  Eye, 
  AlertTriangle, 
  FileText, 
  Settings,
  Info,
  Sparkles,
  FileImage
} from 'lucide-react';
import type { DatabaseDocument } from '@/types/database';

interface DocumentValidationControlsProps {
  document: DatabaseDocument;
  isValidated: boolean;
  validatedData: any;
  onValidationModeChange: (enabled: boolean) => void;
  onValidationComplete: () => void;
  selectedTemplate: 'modern' | 'historical';
  onTemplateChange: (template: 'modern' | 'historical') => void;
}

export default function DocumentValidationControls({
  document,
  isValidated,
  validatedData,
  onValidationModeChange,
  onValidationComplete,
  selectedTemplate,
  onTemplateChange
}: DocumentValidationControlsProps) {
  
  // Check if document is a certificate type
  const isCertificate = document.document_type?.includes('certificate') || 
                        document.file_name?.toLowerCase().includes('certificate');

  // Get validation status from extracted data
  const extractedData = document.extracted_data as any;
  const validationStatus = extractedData?.validation_status || 'pending';
  const lastValidatedAt = extractedData?.last_validated_at;
  const validationHistory = extractedData?.validation_history || [];

  // Check if document has structured data
  const hasStructuredData = validatedData?.structured_data || 
                            Object.keys(validatedData || {}).length > 0;

  // Check for signature/stamp data for template recommendation
  const hasSignatureStampData = () => {
    const certificateInfo = validatedData?.structured_data?.certificate_info;
    const rawContent = validatedData?.raw_content || '';
    
    return certificateInfo?.signature || 
           certificateInfo?.stamp || 
           rawContent.toLowerCase().includes('signature') ||
           rawContent.toLowerCase().includes('stamp');
  };

  const getValidationStatusInfo = () => {
    switch (validationStatus) {
      case 'pending':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
          text: 'Pending validation',
          description: 'This document has not been validated yet.',
          color: 'text-orange-600'
        };
      case 'in_progress':
        return {
          icon: <Edit className="h-4 w-4 text-blue-500" />,
          text: 'Validation in progress',
          description: 'This document is currently being validated.',
          color: 'text-blue-600'
        };
      case 'validated':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: 'Validated',
          description: lastValidatedAt 
            ? `Last validated on ${new Date(lastValidatedAt).toLocaleDateString()}`
            : 'This document has been validated.',
          color: 'text-green-600'
        };
      case 'needs_review':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          text: 'Needs review',
          description: 'This document requires additional review.',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <FileText className="h-4 w-4 text-gray-500" />,
          text: 'Unknown status',
          description: 'Validation status is unknown.',
          color: 'text-gray-600'
        };
    }
  };

  const getTemplateRecommendation = () => {
    if (!isCertificate) return null;
    
    const hasSignatureStamp = hasSignatureStampData();
    const recommendedTemplate = hasSignatureStamp ? 'historical' : 'modern';
    const isUsingRecommended = selectedTemplate === recommendedTemplate;
    
    return {
      recommended: recommendedTemplate,
      isUsingRecommended,
      reason: hasSignatureStamp 
        ? 'Document contains signatures/stamps → Historical template recommended'
        : 'No signatures/stamps detected → Modern template recommended'
    };
  };

  const statusInfo = getValidationStatusInfo();
  const templateRec = getTemplateRecommendation();

  if (!hasStructuredData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No structured data available for validation. The document may still be processing.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Document Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {statusInfo.icon}
              <div>
                <p className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </div>
            
            {validationHistory.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {validationHistory.length} validation{validationHistory.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Template Selection for Certificates */}
          {isCertificate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Display Template
                </label>
                
                <Select
                  value={selectedTemplate}
                  onValueChange={(value: 'modern' | 'historical') => onTemplateChange(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Modern Template
                      </div>
                    </SelectItem>
                    <SelectItem value="historical">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Historical Template
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Recommendation */}
              {templateRec && (
                <div className={`p-3 rounded-lg border ${
                  templateRec.isUsingRecommended 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {templateRec.isUsingRecommended ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${
                        templateRec.isUsingRecommended ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        {templateRec.isUsingRecommended 
                          ? 'Using recommended template' 
                          : `Consider switching to ${templateRec.recommended} template`
                        }
                      </p>
                      <p className={`text-xs ${
                        templateRec.isUsingRecommended ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {templateRec.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => onValidationModeChange(true)}
              variant="default"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {validationStatus === 'validated' ? 'Edit Validation' : 'Start Validation'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onValidationModeChange(false)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Only
            </Button>
          </div>

          {/* Validation Instructions */}
          {validationStatus === 'pending' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Validation Process:</strong> Review the extracted data against the original document, 
                make any necessary corrections, and complete the validation to create accurate patient records.
              </AlertDescription>
            </Alert>
          )}

          {/* Re-validation Notice */}
          {validationStatus === 'validated' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This document has been validated. You can still edit the data if corrections are needed. 
                Changes will be tracked in the validation history.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {isCertificate && validatedData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {validatedData.structured_data?.certificate_info?.employee_name ? '✓' : '○'}
            </div>
            <div className="text-xs text-blue-800">Patient Name</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {validatedData.structured_data?.certificate_info?.examination_date ? '✓' : '○'}
            </div>
            <div className="text-xs text-green-800">Exam Date</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {validatedData.structured_data?.certificate_info?.fitness_status ? '✓' : '○'}
            </div>
            <div className="text-xs text-purple-800">Fitness Status</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {validatedData.structured_data?.certificate_info?.company_name ? '✓' : '○'}
            </div>
            <div className="text-xs text-orange-800">Company</div>
          </div>
        </div>
      )}
    </div>
  );
}