
import React from 'react';
import { Button } from '@/components/ui/button';
import DocumentUploader from '@/components/DocumentUploader';
import type { DatabasePatient } from '@/types/database';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: DatabasePatient;
  organizationId?: string;
  onUploadComplete: () => void;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  patient,
  organizationId,
  onUploadComplete
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          Upload Document for {patient.first_name} {patient.last_name}
        </h3>
        <DocumentUploader
          onUploadComplete={onUploadComplete}
          organizationId={organizationId}
          clientOrganizationId={patient.client_organization_id}
          patientId={patient.id}
        />
        <Button 
          variant="outline" 
          onClick={onClose}
          className="mt-4 w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploadDialog;
