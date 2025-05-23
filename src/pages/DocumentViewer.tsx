import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableCertificateTemplateProps {
  extractedData: any;
  documentId: string;
  editable?: boolean;
  onDataChange?: (field: string, value: any) => void;
  validationErrors?: Array<{ field: string; message: string }>;
}

const EditableCertificateTemplate: React.FC<EditableCertificateTemplateProps> = ({
  extractedData,
  documentId,
  editable = false,
  onDataChange,
  validationErrors = []
}) => {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const certificateData = extractedData?.certificate_info || 
                          extractedData?.structured_data?.certificate_info || 
                          {};

  const hasValidationError = (field: string) => {
    return validationErrors.some(error => error.field === field);
  };

  const getValidationMessage = (field: string) => {
    const error = validationErrors.find(error => error.field === field);
    return error?.message;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (onDataChange) {
      onDataChange(field, value);
    }
  };

  const EditableField: React.FC<{
    field: string;
    value: any;
    type?: 'text' | 'date' | 'select' | 'textarea' | 'checkbox';
    options?: string[];
    className?: string;
    placeholder?: string;
    rows?: number;
  }> = ({ field, value, type = 'text', options, className, placeholder, rows = 1 }) => {
    const hasError = hasValidationError(field);
    const isFocused = focusedField === field;

    if (!editable) {
      return (
        <span className={cn("inline-block min-w-[100px]", className)}>
          {value || 'Not specified'}
        </span>
      );
    }

    const baseClassName = cn(
      "border-0 border-b-2 border-dashed border-gray-300 bg-transparent px-1 py-0.5 rounded-none",
      "focus:border-blue-500 focus:outline-none focus:ring-0 focus:bg-blue-50",
      hasError && "border-red-500 bg-red-50",
      isFocused && "bg-blue-50 border-blue-500",
      className
    );

    const fieldProps = {
      value: value || '',
      onChange: (e: any) => handleFieldChange(field, e.target.value),
      onFocus: () => setFocusedField(field),
      onBlur: () => setFocusedField(null),
      className: baseClassName,
      placeholder: placeholder || 'Enter value...'
    };

    switch (type) {
      case 'date':
        return (
          <div className="relative inline-block">
            <Input
              type="date"
              {...fieldProps}
              className={cn(baseClassName, "min-w-[140px]")}
            />
            {hasError && (
              <div className="absolute top-full left-0 z-10 mt-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getValidationMessage(field)}
                </Badge>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="relative inline-block min-w-[150px]">
            <Select
              value={value || ''}
              onValueChange={(newValue) => handleFieldChange(field, newValue)}
            >
              <SelectTrigger className={baseClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <div className="absolute top-full left-0 z-10 mt-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getValidationMessage(field)}
                </Badge>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="relative block w-full">
            <Textarea
              {...fieldProps}
              rows={rows}
              className={cn(baseClassName, "w-full resize-none")}
            />
            {hasError && (
              <div className="absolute top-full left-0 z-10 mt-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getValidationMessage(field)}
                </Badge>
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="relative inline-flex items-center">
            <Checkbox
              checked={value === true || value === 'true' || value === 'yes'}
              onCheckedChange={(checked) => handleFieldChange(field, checked)}
              className="mr-2"
            />
            {hasError && (
              <div className="absolute top-full left-0 z-10 mt-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getValidationMessage(field)}
                </Badge>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative inline-block">
            <Input
              {...fieldProps}
              className={cn(baseClassName, "min-w-[100px]")}
            />
            {hasError && (
              <div className="absolute top-full left-0 z-10 mt-1">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {getValidationMessage(field)}
                </Badge>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-8 border rounded-lg shadow-sm font-mono text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-lg font-bold mb-2">BLUECOLLAR OCCUPATIONAL HEALTH</h1>
        <p className="text-xs mb-1">Tel: +27 11 892 0771/ 011 892 0627</p>
        <p className="text-xs mb-1">Email: admin@bluecollarocc.co.za / office@bluecollarocc.co.za</p>
        <p className="text-xs mb-1">135 Leeuwpoort Street; Boksburg South; Boksburg</p>
        <p className="text-xs">Co Reg: 2014/135234/07</p>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-4">CERTIFICATE OF FITNESS</h2>
        <p className="text-xs mb-2">
          Dr. MJ Mputhi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91
        </p>
        <p className="text-sm mb-4">certify that the following employee:</p>
      </div>

      {/* Employee Information */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Initials & Surname:</span>
          <EditableField 
            field="employee_name" 
            value={certificateData.employee_name}
            className="font-semibold text-blue-700 min-w-[200px]"
            placeholder="Enter full name"
          />
          <span className="ml-4 font-semibold">ID NO:</span>
          <EditableField 
            field="id_number" 
            value={certificateData.id_number}
            className="font-mono min-w-[150px]"
            placeholder="Enter ID number"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Company Name:</span>
          <EditableField 
            field="company_name" 
            value={certificateData.company_name}
            className="min-w-[250px]"
            placeholder="Enter company name"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Date of Examination:</span>
            <EditableField 
              field="examination_date" 
              value={certificateData.examination_date}
              type="date"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Expiry Date:</span>
            <EditableField 
              field="expiry_date" 
              value={certificateData.expiry_date}
              type="date"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Job Title:</span>
          <EditableField 
            field="job_title" 
            value={certificateData.job_title}
            className="min-w-[200px]"
            placeholder="Enter job title"
          />
        </div>
      </div>

      {/* Examination Type */}
      <div className="mb-6">
        <div className="flex items-center gap-4 text-center">
          <EditableField 
            field="pre_employment" 
            value={certificateData.examination_type === 'PRE-EMPLOYMENT'}
            type="checkbox"
          />
          <span className="font-semibold">PRE-EMPLOYMENT</span>
          
          <EditableField 
            field="periodical" 
            value={certificateData.examination_type === 'PERIODICAL'}
            type="checkbox"
          />
          <span className="font-semibold">PERIODICAL</span>
          
          <EditableField 
            field="exit" 
            value={certificateData.examination_type === 'EXIT'}
            type="checkbox"
          />
          <span className="font-semibold">EXIT</span>
        </div>
      </div>

      {/* Medical Examination Tests Table */}
      <div className="mb-6">
        <h3 className="font-bold text-center mb-4">MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span className="font-semibold">Done</span>
              <span className="font-semibold">Results</span>
              <span className="font-semibold">Test</span>
            </div>
            
            {['BLOODS', 'FAR, NEAR VISION', 'SIDE & DEPTH', 'NIGHT VISION'].map((test) => (
              <div key={test} className="grid grid-cols-3 gap-2 text-xs">
                <EditableField 
                  field={`${test.toLowerCase().replace(/[,\s]/g, '_')}_done`}
                  value={certificateData[`${test.toLowerCase().replace(/[,\s]/g, '_')}_done`]}
                  type="checkbox"
                />
                <EditableField 
                  field={`${test.toLowerCase().replace(/[,\s]/g, '_')}_result`}
                  value={certificateData[`${test.toLowerCase().replace(/[,\s]/g, '_')}_result`]}
                  className="text-xs min-w-[80px]"
                />
                <span>{test}</span>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span className="font-semibold">Done</span>
              <span className="font-semibold">Results</span>
              <span className="font-semibold">Test</span>
            </div>
            
            {['Hearing', 'Working at Heights', 'Lung Function', 'X-Ray', 'Drug Screen'].map((test) => (
              <div key={test} className="grid grid-cols-3 gap-2 text-xs">
                <EditableField 
                  field={`${test.toLowerCase().replace(/\s/g, '_')}_done`}
                  value={certificateData[`${test.toLowerCase().replace(/\s/g, '_')}_done`]}
                  type="checkbox"
                />
                <EditableField 
                  field={`${test.toLowerCase().replace(/\s/g, '_')}_result`}
                  value={certificateData[`${test.toLowerCase().replace(/\s/g, '_')}_result`]}
                  className="text-xs min-w-[80px]"
                />
                <span>{test}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-up Actions */}
      <div className="mb-6 grid grid-cols-2 gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold">Referred or follow up actions:</span>
            <EditableField 
              field="follow_up_actions" 
              value={certificateData.follow_up_actions}
              className="min-w-[150px]"
            />
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold">Review Date:</span>
            <EditableField 
              field="review_date" 
              value={certificateData.review_date}
              type="date"
            />
          </div>
        </div>
      </div>

      {/* Restrictions */}
      <div className="mb-6">
        <div className="mb-2">
          <span className="font-semibold">Restrictions:</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            'Heights', 'Dust Exposure', 'Motorized Equipment', 'Wear Hearing Protection',
            'Confined Spaces', 'Chemical Exposure', 'Wear Spectacles', 'Remain on Treatment for Chronic Conditions'
          ].map((restriction) => (
            <div key={restriction} className="flex items-center gap-2">
              <EditableField 
                field={`restriction_${restriction.toLowerCase().replace(/\s/g, '_')}`}
                value={certificateData[`restriction_${restriction.toLowerCase().replace(/\s/g, '_')}`]}
                type="checkbox"
              />
              <span>{restriction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Fitness Declaration */}
      <div className="mb-6">
        <h3 className="font-bold text-center mb-4">Medical Fitness Declaration</h3>
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          {['FIT', 'Fit with Restriction', 'Fit with Condition', 'Temporary Unfit', 'UNFIT'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <EditableField 
                field="medical_fitness"
                value={certificateData.medical_fitness === status}
                type="checkbox"
              />
              <span className={certificateData.medical_fitness === status ? 'font-bold' : ''}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="mb-6">
        <div className="mb-2">
          <span className="font-semibold">Comments:</span>
        </div>
        <EditableField 
          field="comments" 
          value={certificateData.comments}
          type="textarea"
          rows={3}
          placeholder="Enter any additional comments..."
        />
      </div>

      {/* Signature Section */}
      <div className="mb-6 text-center">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="h-16 border-b border-gray-400 mb-2"></div>
            <p className="text-xs">SIGNATURE</p>
          </div>
          <div>
            <div className="h-16 border-b border-gray-400 mb-2"></div>
            <p className="text-xs">STAMP</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs">
        <p className="mb-2">Occupational Health Practitioner / Occupational Medical Practitioner</p>
        <p className="mb-1">Dr MJ Mphuthi / Practice No. 0404160</p>
        <p className="mb-1">Sr. Sibongile Mahlangu</p>
        <p>SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</p>
        <p>Practice Number: 999 088 0000 8177 91</p>
      </div>

      {/* Editing Instructions */}
      {editable && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <p className="font-semibold mb-1">Editing Instructions:</p>
          <p>• Click on any underlined field to edit it</p>
          <p>• Compare with the original document on the right to ensure accuracy</p>
          <p>• Red highlights indicate validation errors that need to be fixed</p>
          <p>• Click "Save" when all corrections are complete</p>
        </div>
      )}
    </div>
  );
};

export default EditableCertificateTemplate;