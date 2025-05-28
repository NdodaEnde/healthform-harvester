
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Upload } from 'lucide-react';

interface PatientDetailHeaderProps {
  patientId: string;
  onUploadClick: () => void;
}

const PatientDetailHeader: React.FC<PatientDetailHeaderProps> = ({
  patientId,
  onUploadClick
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between mb-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/patients/${patientId}/edit`)}
          className="hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Patient
        </Button>
        <Button 
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>
    </div>
  );
};

export default PatientDetailHeader;
