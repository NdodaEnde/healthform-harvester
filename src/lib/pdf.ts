
// Re-export the functions from their original locations
// This is a convenience file to simplify imports
import { generatePdfFromElement, generatePdfBlobFromElement } from "@/utils/pdf-generator";
import { sendCertificateEmail } from "@/utils/email-utils";

export { 
  generatePdfFromElement, 
  generatePdfBlobFromElement,
  sendCertificateEmail
};
