
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
  processingProgress?: number;
}

export const useDocumentProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingResult>({
    data: null,
    error: null,
    isProcessing: false,
    processingProgress: 0
  });

  const processDocument = async (file: File, query?: string): Promise<void> => {
    setProcessingState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null, 
      processingProgress: 0 
    }));

    const formData = new FormData();
    formData.append('file', file);

    // Set up a progress simulation since the actual SDK processing
    // doesn't provide real-time progress updates
    const progressInterval = setInterval(() => {
      setProcessingState(prev => {
        // For large files, progress more slowly to reflect SDK processing time
        const fileSize = file.size / (1024 * 1024); // Size in MB
        const isLargeFile = fileSize > 5; // Over 5MB is considered large
        
        let increment = isLargeFile ? 2 : 5;
        // Slow down as we get closer to completion
        if (prev.processingProgress && prev.processingProgress > 60) {
          increment = isLargeFile ? 1 : 2;
        }
        
        const newProgress = Math.min((prev.processingProgress || 0) + increment, 90);
        return { ...prev, processingProgress: newProgress };
      });
    }, 1000);

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

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      setProcessingState({
        data: result,
        error: null,
        isProcessing: false,
        processingProgress: 100
      });

      toast({
        title: "Document processed successfully",
        description: query 
          ? "The document has been analyzed and processed with AI."
          : "The document has been analyzed and processed.",
      });
      
      return;
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingState({
        data: null,
        error: errorMessage,
        isProcessing: false,
        processingProgress: 0
      });

      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Rethrow so callers can handle it
    }
  };

  const analyzeWithQuery = async (query: string): Promise<void> => {
    if (!processingState.data) {
      toast({
        title: "No document loaded",
        description: "Please process a document first before analyzing.",
        variant: "destructive"
      });
      return Promise.resolve();
    }

    setProcessingState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // If the user wants to analyze with a query, we'll re-upload the document with the query
      // This is a simplified implementation that tells the user to re-upload with a query
      toast({
        title: "Analysis feature",
        description: "To analyze a document with a query, please reupload the document with your query.",
        variant: "default"
      });

      setProcessingState(prev => ({ ...prev, isProcessing: false }));
      return Promise.resolve();
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
      
      return Promise.resolve();
    }
  };

  return {
    ...processingState,
    processDocument,
    analyzeWithQuery,
  };
};
