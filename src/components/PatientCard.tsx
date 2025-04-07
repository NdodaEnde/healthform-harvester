
import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, FileText, User, BadgeCheck, Flag } from 'lucide-react';
import { PatientInfo } from '@/types/patient';

interface PatientCardProps {
  patient: PatientInfo;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const navigate = useNavigate();
  
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const formatDateOfBirth = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Unknown';
    try {
      return format(new Date(dateOfBirth), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const handleViewPatient = () => {
    navigate(`/patients/${patient.id}`);
  };

  const handleEditPatient = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/patients/${patient.id}/edit`);
  };
  
  const getStatusBadge = () => {
    if (!patient.medical_history?.assessment?.fitness_conclusion) {
      return <Badge variant="secondary">No Assessment</Badge>;
    }
    
    const conclusion = patient.medical_history.assessment.fitness_conclusion.toLowerCase();
    
    if (conclusion.includes("fit") && !conclusion.includes("unfit")) {
      return <Badge variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Fit</Badge>;
    } else if (conclusion.includes("unfit")) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">Unfit</Badge>;
    } else if (conclusion.includes("conditional") || conclusion.includes("restrict")) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Conditional</Badge>;
    } else {
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Get the display age - prefer the validated age_at_registration if available, otherwise calculate it
  const displayAge = patient.age_at_registration || calculateAge(patient.date_of_birth);

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      onClick={handleViewPatient}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">
              {patient.first_name} {patient.last_name}
            </h3>
            <div className="text-sm text-muted-foreground">
              ID: {patient.id.substring(0, 8)}...
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center text-sm gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>DOB: {formatDateOfBirth(patient.date_of_birth)}</span>
            {displayAge && <Badge variant="outline" className="ml-1">{displayAge} years</Badge>}
          </div>
          
          <div className="flex items-center text-sm gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{patient.gender || 'Unknown'}</span>
          </div>

          {/* Add citizenship information */}
          {patient.citizenship && (
            <div className="flex items-center text-sm gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <span>
                {patient.citizenship === 'citizen' ? 'SA Citizen' : 
                 patient.citizenship === 'permanent_resident' ? 'Permanent Resident' : 
                 patient.citizenship}
              </span>
              {patient.id_number_validated && (
                <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  Validated
                </Badge>
              )}
            </div>
          )}

          {patient.contact_info?.email && (
            <div className="text-sm font-medium text-blue-600 truncate">
              {patient.contact_info.email}
            </div>
          )}
          
          {patient.contact_info?.phone && (
            <div className="text-sm">
              {patient.contact_info.phone}
            </div>
          )}
          
          {patient.contact_info?.company && (
            <div className="text-sm">
              Company: {patient.contact_info.company}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-muted/50 p-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Added: {format(new Date(patient.created_at), 'MMM d, yyyy')}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleEditPatient} className="h-8 px-2">
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={handleViewPatient} className="h-8 px-2">
            View <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PatientCard;
