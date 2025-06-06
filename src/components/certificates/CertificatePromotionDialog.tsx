import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertTriangle, User, FileText, Calendar } from 'lucide-react';
import { promoteToPatientRecord, checkForDuplicates } from '@/services/certificatePromotionService';
import { toast } from 'sonner';

interface DocumentPromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  validatedData: any;
  organizationId: string;
  clientOrganizationId?: string;
  onPromotionComplete?: () => void;
}

const CertificatePromotionDialog: React.FC<DocumentPromotionDialogProps> = ({
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

  // Extract patient information from various data structures
  const getPatientInfo = (data: any) => {
    // Handle different data structures
    const patientName = data.patientName || 
                       data.patient?.name || 
                       data.name || 
                       'Unknown Patient';
    
    const patientId = data.patientId || 
                     data.patient?.id_number || 
                     data.patient?.employee_id || 
                     data.patient?.id || 
                     data.id_number || 
                     data.employee_id || 
                     'No ID';
    
    const status = data.fitnessStatus || 
                  data.status || 
                  data.conclusion || 
                  'Processed';
    
    const examDate = data.examinationDate || 
                    data.examination_date || 
                    data.date || 
                    new Date().toISOString().split('T')[0];
    
    return {
      name: patientName,
      id: patientId,
      status: status,
      examDate: examDate
    };
  };

  const patientInfo = getPatientInfo(validatedData);

  const handlePromote = async () => {
    try {
      setIsPromoting(true);

      // Check for duplicates first
      const duplicates = await checkForDuplicates(
        patientInfo.id,
        patientInfo.examDate,
        organizationId
      );

      if (duplicates.hasDuplicates) {
        setDuplicateCheck(duplicates);
        return;
      }

      // Proceed with promotion - prepare data based on what's available
      const promotionData = {
        patientName: patientInfo.name,
        patientId: patientInfo.id,
        companyName: validatedData.companyName || validatedData.company || '',
        occupation: validatedData.occupation || validatedData.job_title || '',
        fitnessStatus: patientInfo.status,
        restrictionsText: validatedData.restrictionsText || 
                         validatedData.restrictions || 
                         'None',
        examinationDate: patientInfo.examDate,
        expiryDate: validatedData.expiryDate || 
                   validatedData.valid_until || 
                   validatedData.expiry_date || '',
        examinationType: validatedData.examinationType || 
                        validatedData.examination_type || 
                        'general',
        comments: validatedData.comments || '',
        followUpActions: validatedData.followUpActions || 
                        validatedData.follow_up || 
                        validatedData.followup_actions || ''
      };

      const result = await promoteToPatientRecord(
        documentId,
        promotionData,
        organizationId,
        clientOrganizationId
      );

      toast.success('Document successfully promoted to patient record!');
      onPromotionComplete?.();
      onClose();

    } catch (error) {
      console.error('Error promoting document:', error);
      toast.error('Failed to promote document to patient record');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleForcePromote = async () => {
    try {
      setIsPromoting(true);
      
      // Prepare data for promotion (same as above)
      const promotionData = {
        patientName: patientInfo.name,
        patientId: patientInfo.id,
        companyName: validatedData.companyName || validatedData.company || '',
        occupation: validatedData.occupation || validatedData.job_title || '',
        fitnessStatus: patientInfo.status,
        restrictionsText: validatedData.restrictionsText || 
                         validatedData.restrictions || 
                         'None',
        examinationDate: patientInfo.examDate,
        expiryDate: validatedData.expiryDate || 
                   validatedData.valid_until || 
                   validatedData.expiry_date || '',
        examinationType: validatedData.examinationType || 
                        validatedData.examination_type || 
                        'general',
        comments: validatedData.comments || '',
        followUpActions: validatedData.followUpActions || 
                        validatedData.follow_up || 
                        validatedData.followup_actions || ''
      };

      const result = await promoteToPatientRecord(
        documentId,
        promotionData,
        organizationId,
        clientOrganizationId
      );

      toast.success('Document promoted despite duplicates!');
      onPromotionComplete?.();
      onClose();

    } catch (error) {
      console.error('Error force promoting document:', error);
      toast.error('Failed to promote document');
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
                  This will create a permanent patient record from the validated document data.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Patient:</strong> {patientInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span><strong>ID:</strong> {patientInfo.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Status:</strong> {patientInfo.status}</span>
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