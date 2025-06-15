
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, IdCard, Building } from 'lucide-react';
import type { DatabasePatient } from '@/types/database';

interface PatientInfoCardProps {
  patient: DatabasePatient;
  organizationName?: string;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ 
  patient, 
  organizationName 
}) => {
  // Use birthdate_from_id if available, otherwise fall back to date_of_birth
  const displayBirthdate = patient.birthdate_from_id || patient.date_of_birth;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{patient.first_name} {patient.last_name}</span>
              </div>
              {patient.id_number && (
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ID Number:</span>
                  <span>{patient.id_number}</span>
                </div>
              )}
              {displayBirthdate && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Date of Birth:</span>
                  <span>{new Date(displayBirthdate).toLocaleDateString()}</span>
                </div>
              )}
              {patient.gender && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Gender:</span>
                  <Badge variant="outline">{patient.gender}</Badge>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Organization</h3>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Organization:</span>
              <span>{organizationName || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
