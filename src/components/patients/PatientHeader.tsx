
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import type { DatabasePatient } from '@/types/database';

interface PatientHeaderProps {
  patient: DatabasePatient;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {patient.first_name} {patient.last_name}
        </CardTitle>
        <CardDescription>
          {patient.id_number && `ID: ${patient.id_number} • `}
          Patient ID: {patient.id}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default PatientHeader;
