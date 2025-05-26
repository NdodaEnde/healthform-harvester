
// Utility functions for cleaning certificate data from HTML comments and metadata

export const cleanCertificateText = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Remove HTML comments and their content
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove any remaining HTML tags
  const withoutTags = withoutComments.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace
  const cleaned = withoutTags.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

export const cleanCertificateData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => cleanCertificateData(item));
  }
  
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      cleaned[key] = cleanCertificateText(value);
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanCertificateData(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
};

export const extractCertificateInfo = (extractedData: any) => {
  if (!extractedData) return null;
  
  // Clean the data first
  const cleanData = cleanCertificateData(extractedData);
  
  // Try to extract key certificate information
  const info: any = {};
  
  // Look for common certificate fields
  if (cleanData.structured_data) {
    const structured = cleanData.structured_data;
    
    // Extract certification info
    if (structured.certification) {
      info.validUntil = cleanCertificateText(structured.certification.valid_until);
      info.issueDate = cleanCertificateText(structured.certification.issue_date);
      info.examinationDate = cleanCertificateText(structured.certification.examination_date);
    }
    
    // Extract validation info
    if (structured.validation) {
      info.validationDate = cleanCertificateText(structured.validation.date);
    }
    
    // Extract patient info
    if (structured.patient_info) {
      info.patientName = cleanCertificateText(structured.patient_info.name);
      info.patientId = cleanCertificateText(structured.patient_info.id_number);
    }
  }
  
  // Fallback to top-level fields if structured data isn't available
  if (Object.keys(info).length === 0) {
    for (const [key, value] of Object.entries(cleanData)) {
      if (typeof value === 'string' && value.length > 0) {
        info[key] = value;
      }
    }
  }
  
  return Object.keys(info).length > 0 ? info : null;
};
