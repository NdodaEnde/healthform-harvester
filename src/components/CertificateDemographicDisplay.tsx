
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CertificateData } from '@/types/patient';

interface CertificateDemographicDisplayProps {
  certificateData: CertificateData | null;
  className?: string;
}

const CertificateDemographicDisplay: React.FC<CertificateDemographicDisplayProps> = ({ 
  certificateData, 
  className 
}) => {
  if (!certificateData?.structured_data) {
    return null;
  }

  const { structured_data } = certificateData;
  
  // Extract demographic information
  const patientInfo = structured_data.patient || {};
  const certificationInfo = structured_data.certification || {};
  const examinationInfo = structured_data.examination_results || {};
  
  // Check if we have any demographic data to display
  const hasDemographicData = patientInfo.gender || 
                             patientInfo.citizenship || 
                             patientInfo.employee_id || 
                             patientInfo.company || 
                             patientInfo.occupation;
  
  if (!hasDemographicData) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Certificate Demographics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patientInfo.gender && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Gender</span>
              <Badge variant="outline">{patientInfo.gender}</Badge>
            </div>
          )}
          
          {patientInfo.citizenship && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Citizenship</span>
              <Badge variant="outline">{patientInfo.citizenship}</Badge>
            </div>
          )}
          
          {patientInfo.employee_id && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">ID Number</span>
              <Badge variant="outline">{patientInfo.employee_id}</Badge>
            </div>
          )}
          
          {patientInfo.company && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Company</span>
              <span className="text-sm">{patientInfo.company}</span>
            </div>
          )}
          
          {patientInfo.occupation && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Occupation</span>
              <span className="text-sm">{patientInfo.occupation}</span>
            </div>
          )}

          {certificationInfo.examination_date && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Exam Date</span>
              <span className="text-sm">
                {certificationInfo.examination_date}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateDemographicDisplay;
