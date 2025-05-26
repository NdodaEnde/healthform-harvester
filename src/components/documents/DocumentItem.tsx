
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Eye } from 'lucide-react';
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

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{document.file_name}</h4>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <Badge variant="outline">{document.document_type || 'unknown'}</Badge>
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
