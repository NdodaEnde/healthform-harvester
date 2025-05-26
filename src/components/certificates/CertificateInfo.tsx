
import React from 'react';
import { Info } from 'lucide-react';
import { extractCertificateInfo, cleanCertificateText } from '@/utils/certificate-data-cleaner';

interface CertificateInfoProps {
  extractedData: any;
}

const CertificateInfo: React.FC<CertificateInfoProps> = ({ extractedData }) => {
  const certInfo = extractCertificateInfo(extractedData);
  
  if (!certInfo) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <h5 className="text-sm font-medium flex items-center gap-1 mb-2">
        <Info className="h-3 w-3" />
        Certificate Information
      </h5>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {certInfo.validUntil && (
          <div>
            <span className="font-medium">Valid until:</span> {cleanCertificateText(certInfo.validUntil)}
          </div>
        )}
        {certInfo.issueDate && (
          <div>
            <span className="font-medium">Issue date:</span> {cleanCertificateText(certInfo.issueDate)}
          </div>
        )}
        {certInfo.examinationDate && (
          <div>
            <span className="font-medium">Examination:</span> {cleanCertificateText(certInfo.examinationDate)}
          </div>
        )}
        {certInfo.patientName && (
          <div>
            <span className="font-medium">Patient:</span> {cleanCertificateText(certInfo.patientName)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateInfo;
