
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PatientInfo } from '@/types/patient';

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
  const getContactInfo = () => {
    if (!patient.contact_info) {
      return {};
    }
    
    if (typeof patient.contact_info === 'object' && patient.contact_info !== null) {
      return patient.contact_info;
    }
    
    // If it's a string (JSON), try to parse it
    if (typeof patient.contact_info === 'string') {
      try {
        return JSON.parse(patient.contact_info);
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
    if (patient.medical_history?.documents) {
      return patient.medical_history.documents.length;
    }
    return 0;
  };

  // Determine patient status based on medical history
  const getPatientStatus = () => {
    if (!patient.medical_history?.assessment?.fitness_conclusion) {
      return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    }

    const conclusion = patient.medical_history.assessment.fitness_conclusion.toLowerCase();
    
    if (conclusion.includes("fit") || conclusion.includes("suitable")) {
      return { label: "Fit", color: "bg-emerald-100 text-emerald-800" };
    } else if (conclusion.includes("unfit") || conclusion.includes("not suitable")) {
      return { label: "Unfit", color: "bg-red-100 text-red-800" };
    } else if (conclusion.includes("temporarily") || conclusion.includes("conditional")) {
      return { label: "Conditional", color: "bg-blue-100 text-blue-800" };
    }
    
    return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
  };

  const status = getPatientStatus();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white border-purple-50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b bg-gradient-to-r from-purple-50 to-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-medium">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <h3 className="font-medium text-purple-900">{patient.first_name} {patient.last_name}</h3>
            {patient.client_organization_id && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Client</Badge>
            )}
          </div>
          <p className="text-sm text-purple-600">
            {getGenderLabel(patient.gender)} • {calculateAge(patient.date_of_birth)} years old
          </p>
        </div>
        <Badge className={`${status.color} border-0`}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 bg-white">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Date of Birth:</span>
            <span className="text-gray-600">{format(new Date(patient.date_of_birth), 'PP')}</span>
          </div>
          {contactInfo.email && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Email:</span>
              <span className="truncate max-w-[180px] text-gray-600">{contactInfo.email}</span>
            </div>
          )}
          {contactInfo.phone && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="text-gray-600">{contactInfo.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Added:</span>
            <span className="text-gray-600">{format(new Date(patient.created_at), 'PP')}</span>
          </div>
          {getRecordsCount() > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Records:</span>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                {getRecordsCount()}
              </Badge>
            </div>
          )}
          
          {showActions && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewPatient}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Eye className="mr-1 h-4 w-4" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditPatient}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Edit className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewRecords}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
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
