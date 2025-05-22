
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
import { CertificateData, FormattedCertificateData, FitnessStatus, extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';

interface EnhancedCertificateGeneratorProps {
  patientId?: string;
  documentId?: string;
  onClose?: () => void;
  document?: any;
}

const EnhancedCertificateGenerator = ({ 
  patientId, 
  documentId,
  onClose,
  document
}: EnhancedCertificateGeneratorProps) => {
  const [certificateData, setCertificateData] = useState<FormattedCertificateData | null>(null);
  const [fitnessStatus, setFitnessStatus] = useState<FitnessStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: documentData } = useQuery({
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
    enabled: !!documentId && !document,
  });

  useEffect(() => {
    // If document is provided directly, use it first
    const docToUse = document || documentData;
    
    if (docToUse) {
      const extractedData = extractCertificateData(docToUse);
      setCertificateData(formatCertificateData(extractedData));
      setFitnessStatus(determineFitnessStatus(extractedData));
      setIsLoading(false);
    }
  }, [document, documentData]);

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
    content: () => componentRef.current,
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
        <CardTitle>Certificate of Fitness</CardTitle>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
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
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
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
