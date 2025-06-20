
import React from "react";
import ModernCertificateTemplate from "./certificates/ModernCertificateTemplate";
import HistoricalCertificateTemplate from "./certificates/HistoricalCertificateTemplate";

type CertificateTemplateProps = {
  extractedData: any;
  documentId?: string;
  editable?: boolean;
  onDataChange?: (data: any) => void;
  templateType?: 'modern' | 'historical';
};

const CertificateTemplate = ({
  extractedData,
  documentId,
  editable = false,
  onDataChange,
  templateType = 'historical'
}: CertificateTemplateProps) => {
  
  if (templateType === 'modern') {
    return (
      <ModernCertificateTemplate
        extractedData={extractedData}
        documentId={documentId}
        editable={editable}
        onDataChange={onDataChange}
      />
    );
  }

  return (
    <HistoricalCertificateTemplate
      extractedData={extractedData}
      documentId={documentId}
      editable={editable}
      onDataChange={onDataChange}
    />
  );
};

export default CertificateTemplate;
