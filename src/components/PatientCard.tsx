
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Json } from '@/integrations/supabase/types';

interface ContactInfo {
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  contact_info?: ContactInfo | Json | null;
  medical_history?: any;
  organization_id?: string;
  client_organization_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientCardProps {
  patient: PatientInfo;
  showActions?: boolean;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, showActions = true }) => {
  const navigate = useNavigate();
  
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleViewPatient = () => {
    navigate(`/patients/${patient.id}`);
  };

  const handleEditPatient = () => {
    navigate(`/patients/${patient.id}/edit`);
  };

  const handleViewRecords = () => {
    navigate(`/patients/${patient.id}/records`);
  };

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return 'Unknown';
    
    // Capitalize first letter
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Get contact info with better type safety
  const getContactInfo = (): ContactInfo => {
    if (!patient.contact_info) {
      return {};
    }
    
    if (typeof patient.contact_info === 'object' && patient.contact_info !== null) {
      return patient.contact_info as ContactInfo;
    }
    
    // If it's a string (JSON), try to parse it
    if (typeof patient.contact_info === 'string') {
      try {
        return JSON.parse(patient.contact_info) as ContactInfo;
      } catch (e) {
        console.error("Failed to parse contact_info string:", e);
        return {};
      }
    }
    
    return {};
  };

  const contactInfo = getContactInfo();

  // Calculate number of medical records from medical history if available
  const getRecordsCount = () => {
    if (patient.medical_history && patient.medical_history.documents) {
      return patient.medical_history.documents.length;
    }
    return 0;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{patient.first_name} {patient.last_name}</h3>
            {patient.client_organization_id && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Client</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {getGenderLabel(patient.gender)} • {calculateAge(patient.date_of_birth)} years old
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Date of Birth:</span>
            <span>{format(new Date(patient.date_of_birth), 'PP')}</span>
          </div>
          {contactInfo.email && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Email:</span>
              <span className="truncate max-w-[180px]">{contactInfo.email}</span>
            </div>
          )}
          {contactInfo.phone && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Phone:</span>
              <span>{contactInfo.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Added:</span>
            <span>{format(new Date(patient.created_at), 'PP')}</span>
          </div>
          {getRecordsCount() > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Records:</span>
              <Badge variant="secondary">{getRecordsCount()}</Badge>
            </div>
          )}
          
          {showActions && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={handleViewPatient}>
                <Eye className="mr-1 h-4 w-4" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={handleEditPatient}>
                <Edit className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewRecords}>
                <FileText className="mr-1 h-4 w-4" />
                Records
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientCard;
