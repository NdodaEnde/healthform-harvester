import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CertificateData {
  patient: any;
  certification: any;
  examination_results: any;
  restrictions: any;
  raw_content?: string;
}

interface FormattedCertificateData {
  patientName: string;
  patientId: string;
  companyName: string;
  occupation: string;
  examinationDate: string;
  validUntil: string;
  restrictionsText: string;
  rawContent: string;
}

type FitnessStatus = 'fit' | 'fit-with-restrictions' | 'fit-with-condition' | 'temporarily-unfit' | 'unfit' | 'unknown';

interface EnhancedCertificateGeneratorProps {
  patientId: string;
  documentId: string;
  onClose: () => void;
}

const EnhancedCertificateGenerator = ({ 
  patientId, 
  documentId,
  onClose
}: EnhancedCertificateGeneratorProps) => {
  const [certificateData, setCertificateData] = useState<FormattedCertificateData | null>(null);
  const [fitnessStatus, setFitnessStatus] = useState<FitnessStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentId,
  });

  useEffect(() => {
    if (document) {
      const extractedData = extractCertificateData(document);
      setCertificateData(formatCertificateData(extractedData));
      setFitnessStatus(determineFitnessStatus(extractedData));
      setIsLoading(false);
    }
  }, [document]);

  // Fix the useReactToPrint implementation
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: `Certificate of Fitness - ${certificateData?.patientName || 'Patient'}`,
    onBeforePrint: () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      toast({
        title: "Certificate printed",
        description: "The certificate has been sent to your printer."
      });
    },
    // Remove the invalid 'content' property
    // content: () => componentRef.current,
    // Using the 'documentRef' instead which is valid
    documentRef: componentRef,
  });

  const getFitnessStatusDisplay = () => {
    switch (fitnessStatus) {
      case 'fit':
        return <Badge variant="success">Fit for Work</Badge>;
      case 'fit-with-restrictions':
        return <Badge variant="warning">Fit with Restrictions</Badge>;
      case 'fit-with-condition':
        return <Badge variant="warning">Fit with Condition</Badge>;
      case 'temporarily-unfit':
        return <Badge variant="destructive">Temporarily Unfit</Badge>;
      case 'unfit':
        return <Badge variant="destructive">Unfit for Work</Badge>;
      default:
        return <Badge variant="secondary">Status Unknown</Badge>;
    }
  };

  // Update the print button handler
  const printCertificate = () => {
    if (handlePrint) {
      handlePrint();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading certificate...
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle tag="h4">Certificate of Fitness</CardTitle>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {certificateData ? (
          <div ref={componentRef} className="p-4 border rounded-md">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Name</TableCell>
                  <TableCell>{certificateData.patientName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ID Number</TableCell>
                  <TableCell>{certificateData.patientId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Company</TableCell>
                  <TableCell>{certificateData.companyName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Occupation</TableCell>
                  <TableCell>{certificateData.occupation}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h2 className="text-lg font-semibold mt-6 mb-4">Certification Details</h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Examination Date</TableCell>
                  <TableCell>{certificateData.examinationDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Valid Until</TableCell>
                  <TableCell>{certificateData.validUntil}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Fitness Status</TableCell>
                  <TableCell>{getFitnessStatusDisplay()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Restrictions</TableCell>
                  <TableCell>{certificateData.restrictionsText}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No data available for this certificate.</p>
        )}
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {/* Fix the onClick handler for the print button */}
          <Button onClick={printCertificate} variant="default">
            <Printer className="mr-2 h-4 w-4" />
            Print Certificate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;

// Utility functions to extract and format data
function extractCertificateData(document: any): CertificateData {
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

function formatCertificateData(certificateData: CertificateData): FormattedCertificateData {
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

function determineFitnessStatus(certificateData: CertificateData): FitnessStatus {
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
