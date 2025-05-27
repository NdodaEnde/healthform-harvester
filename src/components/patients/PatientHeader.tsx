
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Phone, Mail, FileText } from 'lucide-react';
import type { DatabasePatient } from '@/types/database';

interface PatientHeaderProps {
  patient: DatabasePatient;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get contact info from JSON field
  const contactInfo = patient.contact_info as any;
  const contactNumber = contactInfo?.phone || contactInfo?.contact_number;
  const email = contactInfo?.email;

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
          
          {patient.date_of_birth && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Born: {new Date(patient.date_of_birth).toLocaleDateString()}
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
