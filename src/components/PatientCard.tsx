
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { PatientInfo, ContactInfo } from '@/types/patient';

interface PatientCardProps {
  patient: PatientInfo;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const getDisplayValue = (value: any): string => {
    if (!value) return 'Not specified';
    
    // Handle cases where the value might be an object with metadata
    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to extract the actual value
      if (value.value) return value.value;
      if (value.text) return value.text;
      // If it's just a plain object, return the first string value found
      const stringValues = Object.values(value).filter(v => typeof v === 'string');
      if (stringValues.length > 0) return stringValues[0];
    }
    
    // Handle string values
    if (typeof value === 'string') {
      return value;
    }
    
    return String(value);
  };

  const contactInfo = patient.contact_info as ContactInfo || {};

  // Use birthdate_from_id if available, otherwise fall back to date_of_birth
  const displayBirthdate = patient.birthdate_from_id || patient.date_of_birth;
  
  // Use gender_from_id if available, otherwise fall back to gender
  const displayGender = patient.gender_from_id || patient.gender;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {patient.first_name} {patient.last_name}
        </CardTitle>
        {patient.id_number && (
          <Badge variant="outline">{patient.id_number}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Born: {format(new Date(displayBirthdate), 'MMM d, yyyy')}
            </span>
          </div>
          
          {displayGender && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Gender: {displayGender}</span>
            </div>
          )}
          
          {contactInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getDisplayValue(contactInfo.phone)}</span>
            </div>
          )}
          
          {contactInfo.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getDisplayValue(contactInfo.email)}</span>
            </div>
          )}
          
          {contactInfo.occupation && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Occupation: {getDisplayValue(contactInfo.occupation)}</span>
            </div>
          )}
          
          {contactInfo.company && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Company: {getDisplayValue(contactInfo.company)}</span>
            </div>
          )}
          
          {contactInfo.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getDisplayValue(contactInfo.address)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
