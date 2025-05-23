import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Download, Eye, EyeOff, Save, Edit3, CheckCircle, AlertTriangle, X } from 'lucide-react';
import CertificateTemplate from '@/components/CertificateTemplate';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

interface ExtractedData {
  raw_content?: string;
  structured_data?: {
    certificate_info?: Record<string, any>;
    [key: string]: any;
  };
  chunks?: any[];
  [key: string]: any;
}

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  status: string;
  document_type: string;
  extracted_data: ExtractedData;
  created_at: string;
  validated?: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

const DocumentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'structured' | 'edit'>('pdf');
  const [hideOriginalPdf, setHideOriginalPdf] = useState(false);
  const [editableData, setEditableData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]);

  const fetchDocument = async (documentId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      console.log("Document data:", data);
      
      let processedData: Document = { 
        id: data.id,
        file_name: data.file_name,
        file_path: data.file_path,
        public_url: data.public_url,
        status: data.status,
        document_type: data.document_type || '',
        extracted_data: {},
        created_at: data.created_at,
        validated: data.validated || false
      };
      
      if (data.extracted_data) {
        if (typeof data.extracted_data === 'string') {
          try {
            processedData.extracted_data = JSON.parse(data.extracted_data);
          } catch (parseError) {
            console.error('Error parsing extracted_data JSON:', parseError);
            processedData.extracted_data = { raw_content: data.extracted_data };
          }
        } else {
          processedData.extracted_data = data.extracted_data as ExtractedData;
        }
      }
      
      setDocument(processedData);
      setIsValidated(processedData.validated || false);
      
      // Initialize editable data
      const certificateInfo = processedData.extracted_data?.structured_data?.certificate_info || 
                             processedData.extracted_data?.certificate_info || {};
      setEditableData(certificateInfo);
      
      // Auto-switch to structured view if certificate data exists
      const hasCertificateData = 
        processedData.document_type?.includes('certificate') && 
        (certificateInfo && Object.keys(certificateInfo).length > 0);
      
      if (hasCertificateData) {
        toast.info('Certificate data has been detected and loaded');
        setViewMode('structured');
        validateExtractedData(certificateInfo);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const validateExtractedData = (data: any) => {
    const errors: ValidationError[] = [];
    
    // Define required fields for certificate validation
    const requiredFields = [
      { key: 'employee_name', label: 'Employee Name' },
      { key: 'id_number', label: 'ID Number' },
      { key: 'company_name', label: 'Company Name' },
      { key: 'examination_date', label: 'Examination Date' },
      { key: 'expiry_date', label: 'Expiry Date' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'medical_fitness', label: 'Medical Fitness Status' }
    ];

    // Check for missing required fields
    requiredFields.forEach(field => {
      if (!data[field.key] || data[field.key].toString().trim() === '' || data[field.key] === 'Not specified') {
        errors.push({
          field: field.key,
          message: `${field.label} is required and appears to be missing or incomplete`
        });
      }
    });

    // Validate ID number format (South African ID - 13 digits)
    if (data.id_number && !/^\d{13}$/.test(data.id_number.replace(/\s/g, ''))) {
      errors.push({
        field: 'id_number',
        message: 'ID Number should be 13 digits'
      });
    }

    // Validate date formats
    if (data.examination_date && !isValidDate(data.examination_date)) {
      errors.push({
        field: 'examination_date',
        message: 'Examination date format appears invalid'
      });
    }

    if (data.expiry_date && !isValidDate(data.expiry_date)) {
      errors.push({
        field: 'expiry_date',
        message: 'Expiry date format appears invalid'
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleFieldChange = (field: string, value: any) => {
    const updatedData = { ...editableData, [field]: value };
    setEditableData(updatedData);
    
    // Re-validate when data changes
    validateExtractedData(updatedData);
  };

  const saveValidatedData = async () => {
    try {
      setSaving(true);
      
      // Final validation before saving
      const isValid = validateExtractedData(editableData);
      
      if (!isValid) {
        toast.error('Please fix all validation errors before saving');
        return;
      }

      // Update the document with validated data
      const updatedExtractedData = {
        ...document?.extracted_data,
        structured_data: {
          ...document?.extracted_data?.structured_data,
          certificate_info: editableData
        },
        certificate_info: editableData // Keep both for compatibility
      };

      const { error } = await supabase
        .from('documents')
        .update({
          extracted_data: updatedExtractedData,
          validated: true,
          status: 'validated'
        })
        .eq('id', id);

      if (error) throw error;

      setIsValidated(true);
      setDocument(prev => prev ? { ...prev, validated: true, status: 'validated', extracted_data: updatedExtractedData } : null);
      setViewMode('structured');
      
      toast.success('Certificate data has been validated and saved successfully!');
    } catch (err) {
      console.error('Error saving validated data:', err);
      toast.error('Failed to save validated data');
    } finally {
      setSaving(false);
    }
  };

  const downloadDocument = () => {
    if (document?.public_url) {
      window.open(document.public_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Document not found</p>
      </div>
    );
  }

  const hasCertificateData = document.document_type?.includes('certificate') && 
    (document.extracted_data?.structured_data?.certificate_info || 
     document.extracted_data?.certificate_info);

  const renderEditForm = () => {
    return (
      <div className="space-y-6 p-4">
        {/* Validation Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
          {validationErrors.length === 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <span className={validationErrors.length === 0 ? 'text-green-800' : 'text-amber-800'}>
            {validationErrors.length === 0 
              ? 'All fields validated successfully' 
              : `${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''} found`}
          </span>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {error.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-red-600">{error.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee_name">Employee Name *</Label>
            <Input
              id="employee_name"
              value={editableData.employee_name || ''}
              onChange={(e) => handleFieldChange('employee_name', e.target.value)}
              className={validationErrors.some(e => e.field === 'employee_name') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number *</Label>
            <Input
              id="id_number"
              value={editableData.id_number || ''}
              onChange={(e) => handleFieldChange('id_number', e.target.value)}
              className={validationErrors.some(e => e.field === 'id_number') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              value={editableData.company_name || ''}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
              className={validationErrors.some(e => e.field === 'company_name') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title *</Label>
            <Input
              id="job_title"
              value={editableData.job_title || ''}
              onChange={(e) => handleFieldChange('job_title', e.target.value)}
              className={validationErrors.some(e => e.field === 'job_title') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examination_date">Examination Date *</Label>
            <Input
              id="examination_date"
              type="date"
              value={editableData.examination_date || ''}
              onChange={(e) => handleFieldChange('examination_date', e.target.value)}
              className={validationErrors.some(e => e.field === 'examination_date') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date *</Label>
            <Input
              id="expiry_date"
              type="date"
              value={editableData.expiry_date || ''}
              onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
              className={validationErrors.some(e => e.field === 'expiry_date') ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="medical_fitness">Medical Fitness Status *</Label>
            <Select
              value={editableData.medical_fitness || ''}
              onValueChange={(value) => handleFieldChange('medical_fitness', value)}
            >
              <SelectTrigger className={validationErrors.some(e => e.field === 'medical_fitness') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select fitness status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIT">FIT</SelectItem>
                <SelectItem value="Fit with Restriction">Fit with Restriction</SelectItem>
                <SelectItem value="Fit with Condition">Fit with Condition</SelectItem>
                <SelectItem value="Temporary Unfit">Temporary Unfit</SelectItem>
                <SelectItem value="UNFIT">UNFIT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="examination_type">Examination Type</Label>
            <Select
              value={editableData.examination_type || ''}
              onValueChange={(value) => handleFieldChange('examination_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select examination type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRE-EMPLOYMENT">Pre-Employment</SelectItem>
                <SelectItem value="PERIODICAL">Periodical</SelectItem>
                <SelectItem value="EXIT">Exit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="restrictions">Restrictions</Label>
            <Textarea
              id="restrictions"
              value={editableData.restrictions || ''}
              onChange={(e) => handleFieldChange('restrictions', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={editableData.comments || ''}
              onChange={(e) => handleFieldChange('comments', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setViewMode('structured')}
          >
            Cancel
          </Button>
          <Button
            onClick={saveValidatedData}
            disabled={saving || validationErrors.length > 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Validated Data
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Document Viewer: {document.file_name}</title>
      </Helmet>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold">{document.file_name}</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant={document.status === 'validated' ? 'success' : 
                              document.status === 'processed' ? 'secondary' : 
                              document.status === 'failed' ? 'destructive' : 'secondary'}>
                  {document.status}
                </Badge>
                <Badge variant="outline">
                  {document.document_type}
                </Badge>
                {isValidated && (
                  <Badge className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Validated
                  </Badge>
                )}
                {validationErrors.length > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={viewMode === 'pdf' ? 'default' : 'outline'}
                onClick={() => setViewMode('pdf')}
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                PDF View
              </Button>
              <Button
                variant={viewMode === 'structured' ? 'default' : 'outline'}
                onClick={() => setViewMode('structured')}
                size="sm"
                disabled={!hasCertificateData}
              >
                <FileText className="w-4 h-4 mr-2" />
                {hasCertificateData ? "Certificate View" : "No Certificate Data"}
              </Button>
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                onClick={() => setViewMode('edit')}
                size="sm"
                disabled={!hasCertificateData}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit & Validate
              </Button>
              {document.public_url && (
                <Button variant="outline" onClick={downloadDocument} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              {(viewMode === 'structured' || viewMode === 'edit') && hasCertificateData && (
                <Button 
                  variant="outline" 
                  onClick={() => setHideOriginalPdf(!hideOriginalPdf)} 
                  size="sm"
                >
                  {hideOriginalPdf ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Original
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Original
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${hideOriginalPdf ? '' : 'lg:grid-cols-2'} gap-6`}>
          {/* PDF Viewer - Hidden when hideOriginalPdf is true */}
          {!hideOriginalPdf && (
            <Card className="lg:h-[calc(100vh-220px)]">
              <CardHeader className="pb-2">
                <CardTitle>Original Document</CardTitle>
              </CardHeader>
              <CardContent>
                {document.public_url ? (
                  <div className="w-full h-[600px] border rounded">
                    <embed
                      src={document.public_url}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      className="rounded"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded">
                    <p className="text-gray-500">PDF not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Certificate/Edit View */}
          <Card className={`${hideOriginalPdf ? 'w-full mx-auto max-w-4xl' : ''} lg:h-[calc(100vh-220px)] overflow-hidden`}>
            <CardHeader className="pb-2">
              <CardTitle>
                {viewMode === 'edit' ? 'Edit & Validate Certificate Data' : 
                 viewMode === 'structured' ? 'Certificate Preview' : 'Extracted Data'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto h-full pb-6">
              {viewMode === 'edit' ? (
                renderEditForm()
              ) : viewMode === 'structured' ? (
                <div className="overflow-auto">
                  <CertificateTemplate 
                    extractedData={{ ...document.extracted_data, certificate_info: editableData }}
                    documentId={id || ''}
                    editable={false}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {(document.extracted_data?.structured_data?.certificate_info || editableData) && (
                    <div>
                      <h3 className="font-semibold mb-2">Certificate Information</h3>
                      <div className="space-y-2 text-sm">
                        {Object.entries(editableData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold mb-2">Raw Content Preview</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm max-h-96 overflow-y-auto">
                      {document.extracted_data?.raw_content?.substring(0, 500)}...
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DocumentViewer;