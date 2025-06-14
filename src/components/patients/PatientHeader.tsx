
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Phone, Mail, FileText } from 'lucide-react';
import type { DatabasePatient } from '@/types/database';

interface PatientHeaderProps {
  patient: DatabasePatient;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  // Get contact info from JSON field
  const contactInfo = patient.contact_info as any;
  const contactNumber = contactInfo?.phone || contactInfo?.contact_number;
  const email = contactInfo?.email;

  // Use birthdate_from_id if available, otherwise fall back to date_of_birth
  const displayBirthdate = patient.birthdate_from_id || patient.date_of_birth;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-lg">{patient.first_name} {patient.last_name}</h3>
            <Badge variant="outline">Patient</Badge>
          </div>
          
          {displayBirthdate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Born: {new Date(displayBirthdate).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {contactNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{contactNumber}</span>
            </div>
          )}
          
          {email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{email}</span>
            </div>
          )}
          
          {patient.id_number && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">ID: {patient.id_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientHeader;
