
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Database, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { backfillHistoricalTestResults } from '@/services/medicalTestExtractor';
import { toast } from 'sonner';

export default function BackfillTestResultsUtility() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleBackfill = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);
    setCompleted(false);

    try {
      console.log('Starting backfill process...');
      const backfillResults = await backfillHistoricalTestResults();
      
      setResults(backfillResults);
      setCompleted(true);
      
      const totalTests = backfillResults.reduce((sum, result) => sum + (result.tests_extracted || 0), 0);
      toast.success(`Backfill completed! Extracted ${totalTests} test results from ${backfillResults.length} examinations.`);
      
    } catch (err) {
      console.error('Backfill error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Backfill failed. Please check the logs.');
    } finally {
      setIsRunning(false);
    }
  };

  const totalExtracted = results.reduce((sum, result) => sum + (result.tests_extracted || 0), 0);
  const successfulExaminations = results.filter(r => r.tests_extracted > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Medical Test Results Backfill Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This utility will extract medical test results from existing certificate documents 
            and populate the medical_test_results table. This process analyzes the extracted_data 
            from documents to identify vision tests, hearing tests, lung function tests, and other 
            medical examinations.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={handleBackfill} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Backfill...' : 'Start Backfill Process'}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">Processing historical examinations...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {completed && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Backfill process completed successfully!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{results.length}</div>
                  <div className="text-sm text-muted-foreground">Examinations Processed</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{successfulExaminations}</div>
                  <div className="text-sm text-muted-foreground">With Test Results</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalExtracted}</div>
                  <div className="text-sm text-muted-foreground">Total Tests Extracted</div>
                </div>
              </Card>
            </div>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm font-mono">{result.examination_id}</div>
                        <Badge variant={result.tests_extracted > 0 ? "default" : "secondary"}>
                          {result.tests_extracted} tests
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
