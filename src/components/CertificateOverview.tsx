
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CertificateData } from '@/types/patient';

interface CertificateOverviewProps {
  certificateData: CertificateData | null;
  className?: string;
}

const CertificateOverview: React.FC<CertificateOverviewProps> = ({ 
  certificateData,
  className 
}) => {
  if (!certificateData?.structured_data) {
    return null;
  }

  const { structured_data } = certificateData;
  
  // Extract key certificate information
  const certification = structured_data.certification || {};
  const patient = structured_data.patient || {};
  const examinationResults = structured_data.examination_results || {};

  // Determine fitness status text and color
  let fitnessStatus = 'Unknown';
  let statusColor = 'secondary';
  
  if (certification.fit) {
    fitnessStatus = 'Fit';
    statusColor = 'success';
  } else if (certification.fit_with_restrictions) {
    fitnessStatus = 'Fit with Restrictions';
    statusColor = 'warning';
  } else if (certification.temporarily_unfit) {
    fitnessStatus = 'Temporarily Unfit';
    statusColor = 'destructive';
  } else if (certification.unfit) {
    fitnessStatus = 'Unfit';
    statusColor = 'destructive';
  } else if (examinationResults.fitness_status) {
    fitnessStatus = examinationResults.fitness_status;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Certificate Summary</span>
          <Badge variant={statusColor as any}>{fitnessStatus}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Certification Information */}
          <div>
            <h3 className="font-medium text-sm mb-2">Certification Details</h3>
            <div className="grid grid-cols-2 gap-2">
              {certification.examination_date && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Examination Date</p>
                  <p className="text-sm">{certification.examination_date}</p>
                </div>
              )}
              
              {certification.valid_until && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Valid Until</p>
                  <p className="text-sm">{certification.valid_until}</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Demographic Information */}
          <div>
            <h3 className="font-medium text-sm mb-2">Patient Demographics</h3>
            <div className="grid grid-cols-2 gap-2">
              {patient.gender && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="text-sm capitalize">{patient.gender}</p>
                </div>
              )}
              
              {patient.employee_id && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID Number</p>
                  <p className="text-sm">{patient.employee_id}</p>
                </div>
              )}
              
              {patient.citizenship && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Citizenship</p>
                  <p className="text-sm">{patient.citizenship === 'citizen' ? 'South African Citizen' : patient.citizenship}</p>
                </div>
              )}
              
              {patient.company && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm">{patient.company}</p>
                </div>
              )}
              
              {patient.occupation && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Occupation</p>
                  <p className="text-sm">{patient.occupation}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Comments or Restrictions */}
          {(certification.comments || structured_data.restrictions) && (
            <div>
              <h3 className="font-medium text-sm mb-2">Restrictions & Comments</h3>
              
              {certification.comments && (
                <div className="space-y-1 mb-2">
                  <p className="text-xs text-muted-foreground">Comments</p>
                  <p className="text-sm">{certification.comments}</p>
                </div>
              )}
              
              {structured_data.restrictions && Object.keys(structured_data.restrictions).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(structured_data.restrictions)
                    .filter(([, value]) => value === true)
                    .map(([key]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificateOverview;
