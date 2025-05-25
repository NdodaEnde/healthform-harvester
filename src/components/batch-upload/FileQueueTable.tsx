
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, Eye, X, FileText, Loader2 } from 'lucide-react';
import { QueuedFile, FileStatus, ReviewStatus } from './types';
import { DOCUMENT_TYPES } from './constants';

interface FileQueueTableProps {
  queuedFiles: QueuedFile[];
  uploading: boolean;
  onRemoveFile: (index: number) => void;
  onSetDocumentType: (index: number, type: string) => void;
  onUpdateReviewStatus: (index: number, status: ReviewStatus, note?: string) => void;
}

const FileQueueTable: React.FC<FileQueueTableProps> = ({
  queuedFiles,
  uploading,
  onRemoveFile,
  onSetDocumentType,
  onUpdateReviewStatus
}) => {
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'pending': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getReviewStatusBadge = (reviewStatus: ReviewStatus | undefined) => {
    if (!reviewStatus || reviewStatus === 'not-reviewed') {
      return <Badge variant="outline" className="text-xs">Not Reviewed</Badge>;
    } else if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600 text-white">Reviewed</Badge>;
    } else if (reviewStatus === 'needs-correction') {
      return <Badge variant="destructive" className="text-xs">Needs Correction</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="py-2 px-4">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground">
          <div className="col-span-5">Filename</div>
          <div className="col-span-2">Document Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Review</div>
          <div className="col-span-1">Actions</div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[240px] w-full rounded-md border">
          <div className="p-2 space-y-2">
            {queuedFiles.map((queuedFile, index) => (
              <div 
                key={index}
                className="grid grid-cols-12 gap-2 p-2 text-sm items-center border-b last:border-b-0"
              >
                <div className="col-span-5 flex items-center gap-2 truncate">
                  {getStatusIcon(queuedFile.status)}
                  <span className="truncate" title={queuedFile.file.name}>
                    {queuedFile.file.name}
                  </span>
                </div>
                <div className="col-span-2">
                  {queuedFile.status === 'pending' ? (
                    <Select 
                      value={queuedFile.documentType} 
                      onValueChange={(value) => onSetDocumentType(index, value)}
                      disabled={uploading}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs">
                      {DOCUMENT_TYPES.find(t => t.value === queuedFile.documentType)?.label || queuedFile.documentType}
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {queuedFile.status === 'uploading' || queuedFile.status === 'processing' ? (
                    <Progress value={queuedFile.progress} className="h-2" />
                  ) : queuedFile.status === 'error' ? (
                    <span className="text-xs text-red-500" title={queuedFile.error}>
                      Failed
                    </span>
                  ) : queuedFile.status === 'complete' ? (
                    <span className="text-xs text-green-500">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Pending
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  {(queuedFile.status === 'complete' || queuedFile.documentId) && (
                    <div className="flex gap-1 items-center">
                      {getReviewStatusBadge(queuedFile.reviewStatus)}
                      
                      {queuedFile.documentId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => {
                                  window.open(`/document/${queuedFile.documentId}`, '_blank');
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View document</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {queuedFile.documentId && (
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onUpdateReviewStatus(index, 'reviewed')}
                                >
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mark as reviewed</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => onUpdateReviewStatus(index, 'needs-correction')}
                                >
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Needs correction</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  {queuedFile.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileQueueTable;
