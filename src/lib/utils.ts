import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export function isMacOs() {
  return navigator.userAgent.toLowerCase().includes("mac")
}

// Extract certificate data from various data structures
export function extractCertificateData(data: any): any {
  if (!data) return null;
  
  // Check for structured certificate data in different locations
  if (data.structured_data?.certificate_info) {
    return data.structured_data.certificate_info;
  }
  
  if (data.certificate_info) {
    return data.certificate_info;
  }
  
  // Check for fitness data or restrictions
  if (data.structured_data?.fitness_status || data.fitness_status) {
    return data.structured_data?.fitness_status || data.fitness_status;
  }
  
  // If no structured data, return null
  return null;
}

// Format certificate data for display and editing
export function formatCertificateData(certData: any): {
  patientName: string;
  patientId: string;
  companyName: string;
  occupation: string;
  validUntil: string;
  examinationDate: string;
  restrictionsText: string;
  comments?: string;
  followUpActions?: string;
  reviewDate?: string;
} {
  if (!certData) return {
    patientName: '',
    patientId: '',
    companyName: '',
    occupation: '',
    validUntil: '',
    examinationDate: '',
    restrictionsText: '',
  };
  
  // Extract patient name from employee_name, name, or patient_name
  const patientName = 
    certData.employee_name || 
    certData.name || 
    certData.patient_name || 
    '';
    
  // Extract ID from id_number, identity_number, or patient_id
  const patientId = 
    certData.id_number || 
    certData.identity_number || 
    certData.patient_id || 
    '';
    
  // Extract company name
  const companyName = 
    certData.company_name || 
    certData.employer || 
    '';
    
  // Extract occupation/job title
  const occupation = 
    certData.job_title || 
    certData.occupation || 
    certData.position || 
    '';
    
  // Extract validity date
  const validUntil = 
    certData.expiry_date || 
    certData.valid_until || 
    '';
    
  // Extract examination date
  const examinationDate = 
    certData.examination_date || 
    certData.exam_date || 
    certData.date_examined || 
    '';
    
  // Format restrictions text
  let restrictionsText = 'None';
  
  if (certData.restrictions) {
    const restrictions = certData.restrictions;
    const activeRestrictions = Object.keys(restrictions)
      .filter(key => restrictions[key] === true)
      .map(key => key.replace(/_/g, ' '))
      .map(text => text.charAt(0).toUpperCase() + text.slice(1));
      
    if (activeRestrictions.length > 0) {
      restrictionsText = activeRestrictions.join(', ');
    }
  }
  
  // Extract any comments, follow-up actions, and review date
  const comments = certData.comments || '';
  const followUpActions = certData.follow_up || '';
  const reviewDate = certData.review_date || '';
  
  return {
    patientName,
    patientId,
    companyName,
    occupation,
    validUntil,
    examinationDate,
    restrictionsText,
    comments,
    followUpActions,
    reviewDate
  };
}

// Determine fitness status from certificate data
export function determineFitnessStatus(certData: any): string {
  if (!certData) return 'unknown';
  
  // Check if fitness_status object exists
  if (certData.fitness_status) {
    const fs = certData.fitness_status;
    
    if (fs.fit || fs.fit === true) return 'fit';
    if (fs.fit_with_restrictions || fs.fit_with_condition) return 'fit-with-restrictions';
    if (fs.temporarily_unfit) return 'temporarily-unfit';
    if (fs.unfit) return 'unfit';
  }
  
  // Infer from other data
  if (certData.restrictions && Object.values(certData.restrictions).some(v => v === true)) {
    return 'fit-with-restrictions';
  }
  
  // Default to fit if no negative indicators
  return 'fit';
}
