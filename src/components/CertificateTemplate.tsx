
import React, { useState, useEffect } from 'react';

// Define props interface with editable and onDataChange props
interface CertificateTemplateProps {
  extractedData: any;
  editable?: boolean;
  onDataChange?: (updatedData: any) => void;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ 
  extractedData, 
  editable = false,
  onDataChange
}) => {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    // Process the incoming data
    let processedData = extractedData;
    
    try {
      // Attempt to extract markdown from the data structure
      console.log('Attempting to extract markdown from data structure');
      
      // If needed, you can add custom processing here
      // ...
      
      // If no markdown was found, use the data as is
      if (!processedData) {
        console.log('Could not find markdown in provided data');
        console.log('No markdown found, using extractedData as is');
        processedData = extractedData;
      }
    } catch (error) {
      console.error('Error processing certificate data:', error);
      processedData = extractedData;
    }
    
    console.log('Certificate template using data:', processedData);
    setData(processedData);
  }, [extractedData]);
  
  console.log('CertificateTemplate received data:', extractedData);
  
  // Handle form input changes when in edit mode
  const handleInputChange = (path: string, value: any) => {
    if (!editable || !onDataChange) return;
    
    const pathParts = path.split('.');
    const newData = JSON.parse(JSON.stringify(data || {}));
    
    let current = newData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setData(newData);
    onDataChange(newData);
  };
  
  // Editable field component
  const EditableField = ({ 
    path, 
    label, 
    defaultValue = '',
    type = 'text'
  }: { 
    path: string; 
    label: string; 
    defaultValue?: string;
    type?: string;
  }) => {
    // Get nested value from path (e.g. "structured_data.patient.name")
    const getValue = () => {
      if (!data) return defaultValue;
      
      const pathParts = path.split('.');
      let current = data;
      
      for (const part of pathParts) {
        if (!current || typeof current !== 'object') return defaultValue;
        current = current[part];
      }
      
      return current || defaultValue;
    };
    
    const value = getValue();
    
    if (editable) {
      return (
        <div className="mb-2">
          <label className="block text-xs text-gray-500">{label}</label>
          <input
            type={type}
            className="border border-gray-300 rounded px-2 py-1 w-full"
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
          />
        </div>
      );
    }
    
    return <span>{value || '—'}</span>;
  };
  
  // Build the certificate content based on the data structure
  const renderCertificate = () => {
    if (!data) {
      return <div className="p-8 text-center text-gray-500">No certificate data available</div>;
    }
    
    // Extract common certificate fields
    const patientName = data.patient_info?.name || 
      data.structured_data?.patient?.name || 'Unknown Patient';
    
    const patientDob = data.patient_info?.date_of_birth || 
      data.structured_data?.patient?.date_of_birth || '';
    
    const issueDate = data.structured_data?.certification?.issue_date || 
      data.structured_data?.validation?.date || 
      new Date().toISOString().split('T')[0];
    
    const validUntil = data.structured_data?.certification?.valid_until || '';
    
    const diagnosis = data.structured_data?.medical_assessment?.diagnosis || 
      data.structured_data?.diagnosis || '';
    
    const recommendations = data.structured_data?.medical_assessment?.recommendations || 
      data.structured_data?.recommendations || '';
    
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center uppercase">Medical Certificate</h1>
          <div className="flex justify-between mt-4 text-sm">
            <div>Ref: {data.document_id || 'N/A'}</div>
            <div>
              Issue Date: <EditableField path="structured_data.certification.issue_date" 
                                        label="Issue Date" 
                                        defaultValue={issueDate} 
                                        type="date" />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Name:</p>
              <p className="font-medium">
                <EditableField path="structured_data.patient.name" 
                              label="Patient Name" 
                              defaultValue={patientName} />
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Date of Birth:</p>
              <p>
                <EditableField path="structured_data.patient.date_of_birth" 
                              label="Date of Birth" 
                              defaultValue={patientDob} 
                              type="date" />
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Medical Assessment</h2>
          <div className="mb-4">
            <p className="text-gray-600 text-sm">Diagnosis:</p>
            <div className="border-b border-gray-200 py-2">
              <EditableField path="structured_data.medical_assessment.diagnosis" 
                            label="Diagnosis" 
                            defaultValue={diagnosis} />
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 text-sm">Recommendations:</p>
            <div className="border-b border-gray-200 py-2">
              <EditableField path="structured_data.medical_assessment.recommendations" 
                            label="Recommendations" 
                            defaultValue={recommendations} />
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 text-sm">Valid Until:</p>
            <div className="border-b border-gray-200 py-2">
              <EditableField path="structured_data.certification.valid_until" 
                            label="Valid Until" 
                            defaultValue={validUntil} 
                            type="date" />
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex justify-between">
            <div className="w-1/3">
              <div className="border-t-2 border-black pt-1">
                <p className="text-center text-sm">Physician Signature</p>
              </div>
            </div>
            <div className="w-1/3">
              <p className="text-center text-sm">
                <EditableField path="structured_data.certification.stamp" 
                              label="Stamp/Seal" 
                              defaultValue="Official Medical Stamp" />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`certificate-template bg-white rounded-lg shadow-sm ${editable ? 'border-2 border-dashed border-blue-300' : ''}`}>
      {editable && (
        <div className="bg-blue-50 p-2 text-blue-700 text-sm text-center">
          Edit Mode - Make changes to the certificate data
        </div>
      )}
      {renderCertificate()}
    </div>
  );
};

export default CertificateTemplate;
