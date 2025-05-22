
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { extractCertificateData, formatCertificateData, determineFitnessStatus } from '@/lib/utils';
import { toast } from 'sonner';

export interface EnhancedCertificateGeneratorProps {
  documentId?: string;
  patientId?: string;
  certificateData?: any;
  onGenerate?: () => Promise<void>;
}

const EnhancedCertificateGenerator: React.FC<EnhancedCertificateGeneratorProps> = ({
  documentId,
  patientId,
  certificateData,
  onGenerate = async () => { /* Default empty async function */ }
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fitnessStatus, setFitnessStatus] = useState<string>('unknown');
  
  // Extract and prepare certificate data
  const extractedData = certificateData ? extractCertificateData(certificateData) : null;
  const formattedData = extractedData ? formatCertificateData(extractedData) : null;
  
  // Determine fitness status if we have data
  React.useEffect(() => {
    if (extractedData) {
      const status = determineFitnessStatus(extractedData);
      setFitnessStatus(status);
    }
  }, [extractedData]);

  const handleGenerate = async () => {
    if (!documentId || !patientId) {
      toast.error("Missing required information to generate certificate");
      return;
    }
    
    try {
      setIsGenerating(true);
      // Call the onGenerate prop which is expected to return a Promise
      await onGenerate();
      toast.success("Certificate generated successfully");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!extractedData || !formattedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No certificate data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificate Generation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Patient Information</h3>
            <p>{formattedData.patientName}</p>
            <p className="text-sm text-gray-500">ID: {formattedData.patientId}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Company</h3>
            <p>{formattedData.companyName}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Occupation</h3>
            <p>{formattedData.occupation}</p>
          </div>
          
          <div>
            <h3 className="font-semibold">Medical Status</h3>
            <div className={`
              inline-block px-2 py-1 rounded-md text-sm font-medium
              ${fitnessStatus === 'fit' ? 'bg-green-100 text-green-800' : ''}
              ${fitnessStatus === 'fit-with-restrictions' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${fitnessStatus === 'temporarily-unfit' ? 'bg-orange-100 text-orange-800' : ''}
              ${fitnessStatus === 'unfit' ? 'bg-red-100 text-red-800' : ''}
              ${fitnessStatus === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {fitnessStatus.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </div>
          </div>
          
          {formattedData.restrictionsText !== 'None' && (
            <div>
              <h3 className="font-semibold">Restrictions</h3>
              <p>{formattedData.restrictionsText}</p>
            </div>
          )}
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Certificate'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedCertificateGenerator;
