
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Compare
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

interface ComparisonResult {
  v1Result: any;
  v2Result: any;
  v1ProcessingTime: number;
  v2ProcessingTime: number;
  v1Confidence: number;
  v2Confidence: number;
  v1Errors: string[];
  v2Errors: string[];
  accuracyComparison: {
    v1FieldsExtracted: number;
    v2FieldsExtracted: number;
    totalPossibleFields: number;
  };
}

const ExtractionComparisonPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [comparing, setComparing] = useState(false);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const { getEffectiveOrganizationId } = useOrganization();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResults(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  const runComparison = async () => {
    if (!file) return;

    setComparing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const organizationId = getEffectiveOrganizationId();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'certificate-fitness');
      formData.append('userId', user.id);
      if (organizationId) formData.append('organizationId', organizationId);

      console.log("Starting parallel processing comparison...");

      // Run both versions in parallel
      const [v1Result, v2Result] = await Promise.allSettled([
        processWithV1(formData),
        processWithV2(formData)
      ]);

      const comparison: ComparisonResult = {
        v1Result: v1Result.status === 'fulfilled' ? v1Result.value.data : null,
        v2Result: v2Result.status === 'fulfilled' ? v2Result.value.data : null,
        v1ProcessingTime: v1Result.status === 'fulfilled' ? v1Result.value.processingTime : 0,
        v2ProcessingTime: v2Result.status === 'fulfilled' ? v2Result.value.processingTime : 0,
        v1Confidence: v1Result.status === 'fulfilled' ? (v1Result.value.confidence || 0.5) : 0,
        v2Confidence: v2Result.status === 'fulfilled' ? (v2Result.value.confidence || 0) : 0,
        v1Errors: v1Result.status === 'rejected' ? [v1Result.reason?.message || 'Processing failed'] : [],
        v2Errors: v2Result.status === 'rejected' ? [v2Result.reason?.message || 'Processing failed'] : [],
        accuracyComparison: compareAccuracy(
          v1Result.status === 'fulfilled' ? v1Result.value.data : null,
          v2Result.status === 'fulfilled' ? v2Result.value.data : null
        )
      };

      setResults(comparison);
      
      toast({
        title: "Comparison Complete",
        description: `V1: ${comparison.v1Confidence.toFixed(2)} confidence, V2: ${comparison.v2Confidence.toFixed(2)} confidence`
      });

    } catch (error: any) {
      console.error("Comparison failed:", error);
      toast({
        title: "Comparison Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setComparing(false);
    }
  };

  const processWithV1 = async (formData: FormData) => {
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: formData,
    });
    
    const processingTime = Date.now() - startTime;
    
    if (error) throw error;
    
    return {
      data,
      processingTime,
      confidence: calculateV1Confidence(data)
    };
  };

  const processWithV2 = async (formData: FormData) => {
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('process-document-v2', {
      body: formData,
    });
    
    const processingTime = Date.now() - startTime;
    
    if (error) throw error;
    
    return {
      data,
      processingTime,
      confidence: data.confidence || 0
    };
  };

  const calculateV1Confidence = (data: any): number => {
    // Estimate confidence for V1 based on extracted fields
    const extractedData = data?.extractedData?.structured_data || {};
    let fieldsFound = 0;
    let totalFields = 0;

    const countFields = (obj: any) => {
      for (const [key, value] of Object.entries(obj)) {
        totalFields++;
        if (value && value !== '' && value !== 'N/A') {
          fieldsFound++;
        }
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          countFields(value);
        }
      }
    };

    if (Object.keys(extractedData).length > 0) {
      countFields(extractedData);
      return totalFields > 0 ? fieldsFound / totalFields : 0;
    }

    return 0.5; // Default estimate for V1
  };

  const compareAccuracy = (v1Data: any, v2Data: any) => {
    const v1Fields = countExtractedFields(v1Data?.extractedData?.structured_data || {});
    const v2Fields = countExtractedFields(v2Data?.extractedData || {});
    
    return {
      v1FieldsExtracted: v1Fields,
      v2FieldsExtracted: v2Fields,
      totalPossibleFields: Math.max(v1Fields, v2Fields, 15) // Estimate
    };
  };

  const countExtractedFields = (data: any): number => {
    let count = 0;
    
    const countRecursive = (obj: any) => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'extraction_metadata') continue;
        
        if (value && value !== '' && value !== 'N/A' && 
            !(Array.isArray(value) && value.length === 0)) {
          count++;
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          countRecursive(value);
        }
      }
    };
    
    if (data && typeof data === 'object') {
      countRecursive(data);
    }
    
    return count;
  };

  const getWinner = () => {
    if (!results) return null;
    
    const v1Score = results.v1Confidence;
    const v2Score = results.v2Confidence;
    
    if (v2Score > v1Score + 0.1) return 'v2';
    if (v1Score > v2Score + 0.1) return 'v1';
    return 'tie';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compare className="h-5 w-5" />
          Extraction Method Comparison
          <Badge variant="outline">Testing Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Drop your document here</p>
                <p className="text-sm text-gray-500">PDF, PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>

          <Button 
            onClick={runComparison}
            disabled={!file || comparing}
            className="w-full"
          >
            {comparing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Comparing Extraction Methods...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Compare V1 vs V2 Extraction
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <Alert className={
              getWinner() === 'v2' ? "border-green-200 bg-green-50" :
              getWinner() === 'v1' ? "border-blue-200 bg-blue-50" :
              "border-yellow-200 bg-yellow-50"
            }>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Winner: </strong>
                {getWinner() === 'v2' && 'Structured Extraction V2 (New Method)'}
                {getWinner() === 'v1' && 'Legacy Extraction V1 (Current Method)'}
                {getWinner() === 'tie' && 'Results are comparable'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* V1 Results */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    V1 (Legacy)
                    {getWinner() === 'v1' && <Badge variant="default">Winner</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <Badge variant={results.v1Confidence > 0.8 ? "default" : "secondary"}>
                      {(results.v1Confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{results.v1ProcessingTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fields Extracted:</span>
                    <span>{results.accuracyComparison.v1FieldsExtracted}</span>
                  </div>
                  {results.v1Errors.length > 0 && (
                    <div className="text-red-600 text-sm">
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside">
                        {results.v1Errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* V2 Results */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    V2 (Structured)
                    {getWinner() === 'v2' && <Badge variant="default">Winner</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <Badge variant={results.v2Confidence > 0.8 ? "default" : "secondary"}>
                      {(results.v2Confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{results.v2ProcessingTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fields Extracted:</span>
                    <span>{results.accuracyComparison.v2FieldsExtracted}</span>
                  </div>
                  {results.v2Errors.length > 0 && (
                    <div className="text-red-600 text-sm">
                      <strong>Errors:</strong>
                      <ul className="list-disc list-inside">
                        {results.v2Errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="v1-data">V1 Data</TabsTrigger>
                <TabsTrigger value="v2-data">V2 Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Accuracy Comparison</h4>
                    <div className="space-y-2 text-sm">
                      <div>V1 Fields: {results.accuracyComparison.v1FieldsExtracted}</div>
                      <div>V2 Fields: {results.accuracyComparison.v2FieldsExtracted}</div>
                      <div>Improvement: {
                        ((results.accuracyComparison.v2FieldsExtracted - results.accuracyComparison.v1FieldsExtracted) / 
                         Math.max(results.accuracyComparison.v1FieldsExtracted, 1) * 100).toFixed(1)
                      }%</div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Performance Comparison</h4>
                    <div className="space-y-2 text-sm">
                      <div>V1 Time: {results.v1ProcessingTime}ms</div>
                      <div>V2 Time: {results.v2ProcessingTime}ms</div>
                      <div>Difference: {results.v2ProcessingTime - results.v1ProcessingTime}ms</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="v1-data">
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(results.v1Result?.extractedData || {}, null, 2)}
                </pre>
              </TabsContent>
              
              <TabsContent value="v2-data">
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(results.v2Result?.extractedData || {}, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtractionComparisonPanel;
