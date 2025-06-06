import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertTriangle, User, FileText, Calendar } from 'lucide-react';
import { promoteToPatientRecord, checkForDuplicates } from '@/services/certificatePromotionService';
import { toast } from 'sonner';

interface CertificatePromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  validatedData: any;
  organizationId: string;
  clientOrganizationId?: string;
  onPromotionComplete?: () => void;
}

const CertificatePromotionDialog: React.FC<CertificatePromotionDialogProps> = ({
  isOpen,
  onClose,
  documentId,
  validatedData,
  organizationId,
  clientOrganizationId,
  onPromotionComplete
}) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<any>(null);

  const handlePromote = async () => {
    try {
      setIsPromoting(true);

      // Check for duplicates first
      const duplicates = await checkForDuplicates(
        validatedData.patientId,
        validatedData.examinationDate || new Date().toISOString().split('T')[0],
        organizationId
      );

      if (duplicates.hasDuplicates) {
        setDuplicateCheck(duplicates);
        return;
      }

      // Proceed with promotion
      const result = await promoteToPatientRecord(
        documentId,
        {
          patientName: validatedData.patientName,
          patientId: validatedData.patientId,
          companyName: validatedData.companyName,
          occupation: validatedData.occupation,
          fitnessStatus: validatedData.fitnessStatus,
          restrictionsText: validatedData.restrictionsText || 'None',
          examinationDate: validatedData.examinationDate || new Date().toISOString().split('T')[0],
          expiryDate: validatedData.expiryDate,
          examinationType: validatedData.examinationType || 'pre-employment',
          comments: validatedData.comments,
          followUpActions: validatedData.followUpActions
        },
        organizationId,
        clientOrganizationId
      );

      toast.success('Certificate successfully promoted to patient record!');
      onPromotionComplete?.();
      onClose();

    } catch (error) {
      console.error('Error promoting certificate:', error);
      toast.error('Failed to promote certificate to patient record');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleForcePromote = async () => {
    try {
      setIsPromoting(true);
      
      const result = await promoteToPatientRecord(
        documentId,
        {
          patientName: validatedData.patientName,
          patientId: validatedData.patientId,
          companyName: validatedData.companyName,
          occupation: validatedData.occupation,
          fitnessStatus: validatedData.fitnessStatus,
          restrictionsText: validatedData.restrictionsText || 'None',
          examinationDate: validatedData.examinationDate || new Date().toISOString().split('T')[0],
          expiryDate: validatedData.expiryDate,
          examinationType: validatedData.examinationType || 'pre-employment',
          comments: validatedData.comments,
          followUpActions: validatedData.followUpActions
        },
        organizationId,
        clientOrganizationId
      );

      toast.success('Certificate promoted despite duplicates!');
      onPromotionComplete?.();
      onClose();

    } catch (error) {
      console.error('Error force promoting certificate:', error);
      toast.error('Failed to promote certificate');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create Patient Record
          </DialogTitle>
          <DialogDescription>
            {duplicateCheck 
              ? `Found ${duplicateCheck.duplicates.length} existing examination(s) for this patient on the same date.`
              : "This will create a permanent patient record from the validated certificate data."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {duplicateCheck ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {duplicateCheck.duplicates.length} existing examination(s) for this patient on the same date. 
                Do you want to proceed anyway?
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create a permanent patient record from the validated certificate data.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Patient:</strong> {validatedData.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span><strong>ID:</strong> {validatedData.patientId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Status:</strong> {validatedData.fitnessStatus}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPromoting}>
            Cancel
          </Button>
          {duplicateCheck ? (
            <Button onClick={handleForcePromote} disabled={isPromoting}>
              {isPromoting ? 'Promoting...' : 'Proceed Anyway'}
            </Button>
          ) : (
            <Button onClick={handlePromote} disabled={isPromoting}>
              {isPromoting ? 'Creating Record...' : 'Create Patient Record'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatePromotionDialog;