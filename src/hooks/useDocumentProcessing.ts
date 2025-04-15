
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ProcessingResult {
  data: any;
  error: string | null;
  isProcessing: boolean;
}

export const useDocumentProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingResult>({
    data: null,
    error: null,
    isProcessing: false,
  });

  const processDocument = async (file: File): Promise<void> => {
    setProcessingState(prev => ({ ...prev, isProcessing: true, error: null }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      setProcessingState({
        data: result,
        error: null,
        isProcessing: false,
      });

      toast({
        title: "Document processed successfully",
        description: "The document has been analyzed and processed.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingState({
        data: null,
        error: errorMessage,
        isProcessing: false,
      });

      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    ...processingState,
    processDocument,
  };
};
