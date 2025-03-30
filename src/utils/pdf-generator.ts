
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF from an HTML element and triggers a download
 * @param element The HTML element to convert to PDF
 * @param filename The name of the PDF file
 * @returns Promise that resolves when PDF generation is complete
 */
export const generatePdfFromElement = async (
  element: HTMLElement, 
  filename: string = 'certificate.pdf'
): Promise<void> => {
  if (!element) {
    console.error('No element provided for PDF generation');
    throw new Error('Element not found');
  }
  
  try {
    // Set proper scale for better quality
    const scale = 2;
    const canvas = await html2canvas(element, {
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Determine PDF dimensions based on canvas
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    
    // Handle if the image is longer than one page
    const pageCount = Math.ceil(imgHeight / pageHeight);
    
    // If we have more than one page
    if (pageCount > 1) {
      let remainingHeight = imgHeight;
      
      for (let i = 1; i < pageCount; i++) {
        position = -pageHeight * i;
        remainingHeight -= pageHeight;
        
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          position, 
          imgWidth, 
          imgHeight
        );
      }
    }
    
    // Save the PDF
    pdf.save(filename);
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Creates a PDF from HTML content and returns it as a Blob
 * This is useful for email attachments
 * @param element 
 * @returns Promise that resolves with the PDF as a Blob
 */
export const generatePdfBlobFromElement = async (element: HTMLElement): Promise<Blob> => {
  if (!element) {
    console.error('No element provided for PDF generation');
    throw new Error('Element not found');
  }
  
  try {
    // Set proper scale for better quality
    const scale = 2;
    const canvas = await html2canvas(element, {
      scale: scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Determine PDF dimensions based on canvas
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    
    // Handle if the image is longer than one page
    const pageCount = Math.ceil(imgHeight / pageHeight);
    
    // If we have more than one page
    if (pageCount > 1) {
      let remainingHeight = imgHeight;
      
      for (let i = 1; i < pageCount; i++) {
        position = -pageHeight * i;
        remainingHeight -= pageHeight;
        
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          position, 
          imgWidth, 
          imgHeight
        );
      }
    }
    
    // Return as blob instead of triggering download
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw error;
  }
};
