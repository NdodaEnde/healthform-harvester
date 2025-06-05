
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye, User, CheckCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { DatabaseDocument } from '@/types/database';
import CertificateInfo from '@/components/certificates/CertificateInfo';

interface DocumentItemProps {
  document: DatabaseDocument;
  onView: (doc: DatabaseDocument) => void;
  onDownload: (doc: DatabaseDocument) => void;
  showCertificateInfo?: boolean;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ 
  document, 
  onView, 
  onDownload, 
  showCertificateInfo = false 
}) => {
  const safeFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'promoted_to_patient':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <User className="h-3 w-3 mr-1" />
            Patient Record
          </Badge>
        );
      case 'validated':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validated
          </Badge>
        );
      case 'processed':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Needs Review
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Processing
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{document.file_name}</h4>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline">{document.document_type || 'unknown'}</Badge>
            
            {/* @ts-ignore - validation_status exists in database but not in types yet */}
            {document.validation_status && getValidationStatusBadge(document.validation_status)}
            
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {safeFormatDate(document.created_at)}
            </span>
            {document.processed_at && (
              <span>Processed: {safeFormatDate(document.processed_at)}</span>
            )}
          </div>
          {showCertificateInfo && document.extracted_data && (
            <CertificateInfo extractedData={document.extracted_data} />
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(document)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownload(document)}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentItem;
