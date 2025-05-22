
import React from 'react';

interface CertificateTemplateProps {
  extractedData: any;
}

const CertificateTemplate: React.FC<CertificateTemplateProps> = ({ extractedData }) => {
  const certificateInfo = extractedData?.structured_data?.certificate_info;
  const rawContent = extractedData?.raw_content || '';
  
  // Checkbox component
  const Checkbox = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 border border-gray-400 flex items-center justify-center text-xs">
        {checked ? '✓' : ''}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
  
  return (
    <div className="certificate-template bg-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-blue-600 font-bold">LOGO</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-blue-900 text-white px-4 py-2">
              BLUECOLLAR OCCUPATIONAL HEALTH
            </h1>
            <div className="text-sm mt-1">
              <p>Tel: +27 11 892 0771/011 892 0627</p>
              <p>Email: admin@bluecollarhealth.co.za</p>
              <p>office@bluecollarhealth.co.za</p>
              <p>135 Leeuwpoort Street, Boksburg South, Boksburg</p>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">CERTIFICATE OF FITNESS</h2>
        <p className="text-sm mb-2">
          Dr. MJ Mphuthi / Practice No: 0404160 / Sr. Sibongile Mahlangu / Practice No: 999 088 0000 8177 91
        </p>
        <p className="text-sm">certify that the following employee:</p>
      </div>

      {/* Employee Information */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="font-medium">Initials & Surname:</label>
          <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
            {certificateInfo?.employee_name || ''}
          </div>
        </div>
        <div>
          <label className="font-medium">ID NO:</label>
          <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
            {certificateInfo?.id_number || ''}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="font-medium">Company Name:</label>
        <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
          {certificateInfo?.company_name || ''}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="font-medium">Date of Examination:</label>
          <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
            {certificateInfo?.examination_date || ''}
          </div>
        </div>
        <div>
          <label className="font-medium">Expiry Date:</label>
          <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
            {certificateInfo?.expiry_date || ''}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="font-medium">Job Title:</label>
        <div className="border-b border-gray-400 min-h-[1.5rem] pl-2">
          {certificateInfo?.job_title || ''}
        </div>
      </div>

      {/* Examination Type Checkboxes */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4 border border-gray-400 p-4">
          <Checkbox 
            checked={certificateInfo?.pre_employment_checked || false}
            label="PRE-EMPLOYMENT" 
          />
          <Checkbox 
            checked={certificateInfo?.periodical_checked || false}
            label="PERIODICAL" 
          />
          <Checkbox 
            checked={certificateInfo?.exit_checked || false}
            label="EXIT" 
          />
        </div>
      </div>

      {/* Medical Tests Table */}
      <div className="mb-6">
        <h3 className="font-bold text-center mb-2 bg-blue-900 text-white p-2">
          MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS
        </h3>
        <table className="w-full border border-gray-400 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2">Test</th>
              <th className="border border-gray-400 p-2">Done</th>
              <th className="border border-gray-400 p-2">Results</th>
              <th className="border border-gray-400 p-2">Test</th>
              <th className="border border-gray-400 p-2">Done</th>
              <th className="border border-gray-400 p-2">Results</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">BLOODS</td>
              <td className="border border-gray-400 p-2 text-center">X</td>
              <td className="border border-gray-400 p-2">N/A</td>
              <td className="border border-gray-400 p-2">Hearing</td>
              <td className="border border-gray-400 p-2 text-center">
                {certificateInfo?.medical_tests?.hearing_done ? '✓' : 'X'}
              </td>
              <td className="border border-gray-400 p-2">
                {certificateInfo?.medical_tests?.hearing_result || 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2">FAR, NEAR VISION</td>
              <td className="border border-gray-400 p-2 text-center">
                {certificateInfo?.medical_tests?.vision_done ? '✓' : 'X'}
              </td>
              <td className="border border-gray-400 p-2">
                {certificateInfo?.medical_tests?.vision_result || 'N/A'}
              </td>
              <td className="border border-gray-400 p-2">Working at Heights</td>
              <td className="border border-gray-400 p-2 text-center">X</td>
              <td className="border border-gray-400 p-2">N/A</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2">SIDE & DEPTH</td>
              <td className="border border-gray-400 p-2 text-center">✓</td>
              <td className="border border-gray-400 p-2">Normal</td>
              <td className="border border-gray-400 p-2">Lung Function</td>
              <td className="border border-gray-400 p-2 text-center">✓</td>
              <td className="border border-gray-400 p-2">Mild Restriction</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2">NIGHT VISION</td>
              <td className="border border-gray-400 p-2 text-center">✓</td>
              <td className="border border-gray-400 p-2">20/30</td>
              <td className="border border-gray-400 p-2">X-Ray</td>
              <td className="border border-gray-400 p-2 text-center">X</td>
              <td className="border border-gray-400 p-2">N/A</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2"></td>
              <td className="border border-gray-400 p-2"></td>
              <td className="border border-gray-400 p-2"></td>
              <td className="border border-gray-400 p-2">Drug Screen</td>
              <td className="border border-gray-400 p-2 text-center">X</td>
              <td className="border border-gray-400 p-2">N/A</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Restrictions */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Restrictions:</h3>
        <table className="w-full border border-gray-400 text-sm">
          <tbody>
            <tr>
              <td className="border border-gray-400 p-2">Heights</td>
              <td className="border border-gray-400 p-2">Dust Exposure</td>
              <td className="border border-gray-400 p-2">Motorized Equipment</td>
              <td className="border border-gray-400 p-2">Wear Hearing Protection</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2">Confined Spaces</td>
              <td className="border border-gray-400 p-2">Chemical Exposure</td>
              <td className="border border-gray-400 p-2">Wear Spectacles</td>
              <td className="border border-gray-400 p-2">Remain on Treatment for Chronic Conditions</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Medical Fitness Declaration */}
      <div className="mb-6">
        <h3 className="font-bold text-center mb-2 bg-blue-900 text-white p-2">
          Medical Fitness Declaration
        </h3>
        <div className="grid grid-cols-5 gap-2 border border-gray-400 p-2">
          <div className={`text-center p-2 ${certificateInfo?.fit_checked ? 'bg-green-200' : ''}`}>
            <Checkbox checked={certificateInfo?.fit_checked || false} label="FIT" />
          </div>
          <div className="text-center p-2">
            <Checkbox checked={certificateInfo?.fit_with_restriction_checked || false} label="Fit with Restriction" />
          </div>
          <div className="text-center p-2">
            <Checkbox checked={certificateInfo?.fit_with_condition_checked || false} label="Fit with Condition" />
          </div>
          <div className="text-center p-2">
            <Checkbox checked={certificateInfo?.temporary_unfit_checked || false} label="Temporary Unfit" />
          </div>
          <div className="text-center p-2">
            <Checkbox checked={certificateInfo?.unfit_checked || false} label="UNFIT" />
          </div>
        </div>
        <div className="mt-2 border border-gray-400 p-2">
          <span className="font-medium">Comments:</span>
          <div className="mt-1 min-h-[2rem]">
            {certificateInfo?.comments || 'OCCUPATIONAL HEALTH'}
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="text-center">
          <div className="border-b border-gray-400 mb-2 h-16"></div>
          <p className="text-sm font-medium">SIGNATURE</p>
        </div>
        <div className="text-center text-sm">
          <p className="font-medium">Occupational Health Practitioner /</p>
          <p className="font-medium">Occupational Medical Practitioner</p>
          <p className="mt-2"><strong>Dr MJ Mphuthi</strong> / Practice No. 0404160</p>
          <p>Sr. Sibongile Mahlangu</p>
          <p>SANC No: 14262133; SASOHN No: AR 2136 / MBCHB DOH</p>
          <p>Practice Number: <strong>999 088 0000 8177 91</strong></p>
        </div>
        <div className="text-center">
          <div className="border border-gray-400 h-16 flex items-center justify-center mb-2">
            <span className="text-gray-400">STAMP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
