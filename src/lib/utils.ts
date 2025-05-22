
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function titleCase(str: string) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

export function truncate(str: string, n: number){
  return (str.length > n) ? str.slice(0, n-1) + '...' : str;
};

export function formatTimestamp(timestamp: string | number | Date): string {
  try {
    const date = new Date(timestamp);
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return 'Invalid Date';
  }
}

// Define the structure of the certificate data
export interface CertificateData {
  patient: any;
  certification: any;
  examination_results: any;
  restrictions: any;
  raw_content?: string;
}

export interface FormattedCertificateData {
  patientName: string;
  patientId: string;
  companyName: string;
  occupation: string;
  examinationDate: string;
  validUntil: string;
  restrictionsText: string;
  rawContent: string;
}

export type FitnessStatus = 'fit' | 'fit-with-restrictions' | 'fit-with-condition' | 'temporarily-unfit' | 'unfit' | 'unknown';

export function extractCertificateData(document: any): CertificateData {
  // Handle null or undefined document
  if (!document || !document.extracted_data) {
    return {
      patient: {},
      certification: {},
      examination_results: {
        date: '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        }
      },
      restrictions: {}
    };
  }

  // Try to extract data from document
  try {
    const data = document.extracted_data;
    const structuredData = data.structured_data || {};
    
    // Initialize with safe defaults
    const result: CertificateData = {
      patient: structuredData.patient || {},
      certification: structuredData.certification || {},
      examination_results: {
        date: '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        }
      },
      restrictions: structuredData.restrictions || {},
      raw_content: data.raw_content || ''
    };
    
    // Set examination results if available
    if (structuredData.examination_results) {
      result.examination_results = structuredData.examination_results;
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting certificate data:', error);
    // Return default structure on error
    return {
      patient: {},
      certification: {},
      examination_results: {
        date: '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        }
      },
      restrictions: {},
      raw_content: ''
    };
  }
}

export function formatCertificateData(certificateData: CertificateData): FormattedCertificateData {
  const { patient, certification, examination_results, restrictions, raw_content } = certificateData;
  
  // Use safe type checking and defaults
  const patientObj = patient || {};
  const certificationObj = certification || {};
  const restrictionsObj = restrictions || {};
  
  return {
    patientName: patientObj.name?.toString() || 'N/A',
    patientId: patientObj.id_number?.toString() || 'N/A',
    companyName: patientObj.company?.toString() || 'N/A',
    occupation: patientObj.occupation?.toString() || 'N/A',
    examinationDate: certificationObj.examination_date?.toString() || 'N/A',
    validUntil: certificationObj.valid_until?.toString() || 'N/A',
    restrictionsText: Array.isArray(restrictions) 
      ? restrictions.join(', ') 
      : (typeof restrictionsObj === 'string' ? restrictionsObj : 'None'),
    rawContent: raw_content || ''
  };
}

export function determineFitnessStatus(certificateData: CertificateData): FitnessStatus {
  try {
    const examinationResults = certificateData.examination_results || {};
    
    // Create a safe reference to fitness data
    const fitness = examinationResults.fitness || {};
    
    // Check each fitness status with safe property access
    if ((fitness as any)?.fit === true) return 'fit';
    if ((fitness as any)?.fit_with_restrictions === true) return 'fit-with-restrictions';
    if ((fitness as any)?.fit_with_condition === true) return 'fit-with-condition';
    if ((fitness as any)?.temporarily_unfit === true) return 'temporarily-unfit';
    if ((fitness as any)?.unfit === true) return 'unfit';
    
    // If we have raw content but no structured data
    if (certificateData.raw_content) {
      const rawContent = certificateData.raw_content.toLowerCase();
      
      if (rawContent.includes('fit for work') || rawContent.includes('medically fit')) return 'fit';
      if (rawContent.includes('fit with restrictions')) return 'fit-with-restrictions';
      if (rawContent.includes('temporarily unfit')) return 'temporarily-unfit';
      if (rawContent.includes('unfit for work') || rawContent.includes('medically unfit')) return 'unfit';
    }
    
    // Default
    return 'unknown';
  } catch (error) {
    console.error('Error determining fitness status:', error);
    return 'unknown';
  }
}

// Add the missing function that's causing the import error
export function mapExtractedDataToValidatorFormat(extractedData: any) {
  if (!extractedData) return null;
  
  // Create a safe extraction of the data
  const structuredData = extractedData.structured_data || {};
  const rawContent = extractedData.raw_content || '';
  
  return {
    patient: structuredData.patient || {},
    certification: structuredData.certification || {},
    examination_results: structuredData.examination_results || {},
    restrictions: structuredData.restrictions || {},
    raw_content: rawContent
  };
}
