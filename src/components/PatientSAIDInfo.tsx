import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IdCardIcon, CalendarIcon, UserIcon, FlagIcon, CheckIcon, XIcon } from 'lucide-react';
import { PatientInfo } from '@/types/patient';

interface PatientSAIDInfoProps {
  patient: PatientInfo;
}

/**
 * Component that displays South African ID number information for a patient
 */
const PatientSAIDInfo: React.FC<PatientSAIDInfoProps> = ({ patient }) => {
  // If there's no ID number, don't display this component
  if (!patient.id_number) {
    return null;
  }

  // Format the ID number for display (add spaces for readability)
  const formatIDNumber = (idNumber: string) => {
    if (!idNumber) return '';
    
    // Format as YYMMDD SSSS CAS (birth date, gender, citizenship, indicator, checksum)
    return idNumber.replace(/^(\d{6})(\d{4})(\d{1})(\d{1})(\d{1})$/, '$1 $2 $3$4$5');
  };

  // Format the birthdate for display
  const formatBirthdate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IdCardIcon className="h-5 w-5 mr-2 text-primary" />
            <CardTitle className="text-lg">South African ID Information</CardTitle>
          </div>
          {patient.id_number_valid ? (
            <Badge variant="default" className="bg-green-600">
              <CheckIcon className="h-3 w-3 mr-1" /> Valid
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XIcon className="h-3 w-3 mr-1" /> Invalid
            </Badge>
          )}
        </div>
        <CardDescription>Demographic information extracted from ID number</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-1">ID Number</div>
            <div className="font-mono text-lg">{formatIDNumber(patient.id_number)}</div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <CalendarIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Birth Date</div>
                <div>{formatBirthdate(patient.birthdate_from_id)}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Gender</div>
                <div className="capitalize">{patient.gender_from_id || 'Not determined'}</div>
              </div>
            </div>
            
            <div className="flex items-start">
              <FlagIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">Citizenship</div>
                <div className="capitalize">
                  {patient.citizenship_status === 'citizen' ? 'South African Citizen' : 
                   patient.citizenship_status === 'permanent_resident' ? 'Permanent Resident' : 
                   'Not determined'}
                </div>
              </div>
            </div>
          </div>
          
          {patient.id_number_valid === false && (
            <div className="text-sm text-destructive mt-2">
              <p>Note: This ID number did not pass validation. It may contain errors or be improperly formatted.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientSAIDInfo;