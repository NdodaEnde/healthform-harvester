
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface ChunkGrounding {
  page: number;
  box: [number, number, number, number];
  image_path: string | null;
}

interface DocumentChunk {
  text: string;
  metadata: Record<string, any>;
  chunk_type: string;
  groundings: ChunkGrounding[];
}

interface PageMapItem {
  bboxes: [number, number, number, number][];
  captions: string[];
}

interface AIAnalysis {
  answer: string;
  reasoning: string;
  best_chunks: any[];
}

export interface ProcessedDocument {
  markdown: string;
  chunks: DocumentChunk[];
  page_map: Record<string, PageMapItem[]>;
  ai_analysis?: AIAnalysis;
}

interface ProcessingResult {
  data: ProcessedDocument | null;
  error: string | null;
  isProcessing: boolean;
}

export const useDocumentProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingResult>({
    data: null,
    error: null,
    isProcessing: false,
  });

  const processDocument = async (file: File, query?: string): Promise<void> => {
    setProcessingState(prev => ({ ...prev, isProcessing: true, error: null }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Add query parameter for AI analysis if provided
      let endpoint = '/api/extract-document';
      if (query) {
        endpoint += `?query=${encodeURIComponent(query)}`;
      }

      const response = await fetch(endpoint, {
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
        description: query 
          ? "The document has been analyzed and processed with AI."
          : "The document has been analyzed and processed.",
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

  const analyzeWithQuery = async (query: string): Promise<void> => {
    if (!processingState.data) {
      toast({
        title: "No document loaded",
        description: "Please process a document first before analyzing.",
        variant: "destructive"
      });
      return;
    }

    setProcessingState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // This is a simplified implementation - in a full app, you would either:
      // 1. Call a separate API endpoint with the document data and query, or
      // 2. Re-upload the document with the query parameter

      toast({
        title: "Analysis feature",
        description: "To analyze a document with a query, please reupload the document with your query.",
        variant: "default"
      });

      setProcessingState(prev => ({ ...prev, isProcessing: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
      }));

      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    ...processingState,
    processDocument,
    analyzeWithQuery,
  };
};
