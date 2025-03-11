
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rlsTester } from "@/utils/rls-tester";
import { Shield, ShieldAlert, ShieldCheck, User, Building, FileText, Edit, ArrowRight, AlertTriangle, CheckCircle2, Database, LockCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

type TestResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
  results?: Record<string, any>;
};

const RlsTester = () => {
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Record<string, TestResult> | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [showTestData, setShowTestData] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setResults(null);
    setProgress(0);
    
    try {
      // Run tests with progress tracking
      const testResults = await runTestsWithProgress();
      setResults(testResults);
      
      // Display a toast when done
      const allPassed = Object.values(testResults).every(r => r.success);
      if (allPassed) {
        toast({
          title: "All RLS Tests Passed!",
          description: "Your multi-tenant security policies are working correctly.",
          variant: "default",
        });
      } else {
        toast({
          title: "RLS Policy Issues Detected",
          description: "Some tests failed. Please review the details below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running RLS tests:", error);
      toast({
        title: "Test Error",
        description: "Failed to run RLS tests. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRunningTest(null);
      setProgress(100);
    }
  };

  // Run tests with progress updates
  const runTestsWithProgress = async () => {
    const testFunctions = {
      documents: { fn: rlsTester.testTableAccess.bind(rlsTester, 'documents'), label: "Testing documents table access" },
      patients: { fn: rlsTester.testTableAccess.bind(rlsTester, 'patients'), label: "Testing patients table access" },
      organizations: { fn: rlsTester.testTableAccess.bind(rlsTester, 'organizations'), label: "Testing organizations table access" },
      documentAccessControl: { fn: rlsTester.testDocumentAccessControl.bind(rlsTester), label: "Testing document access control" },
      organizationAccess: { fn: rlsTester.testOrganizationAccess.bind(rlsTester), label: "Testing organization access" },
      patientAccess: { fn: rlsTester.testPatientAccess.bind(rlsTester), label: "Testing patient access" },
      writeOperations: { fn: rlsTester.testWriteOperations.bind(rlsTester), label: "Testing write operations" },
    };
    
    const testNames = Object.keys(testFunctions);
    const totalTests = testNames.length;
    const results: Record<string, TestResult> = {};
    
    for (let i = 0; i < testNames.length; i++) {
      const testName = testNames[i];
      const { fn, label } = testFunctions[testName as keyof typeof testFunctions];
      
      setRunningTest(label);
      setProgress(Math.round((i / totalTests) * 100));
      
      try {
        results[testName] = await fn();
      } catch (error) {
        console.error(`Error in test ${testName}:`, error);
        results[testName] = {
          success: false,
          message: `Error running test: ${error instanceof Error ? error.message : String(error)}`,
          error
        };
      }
      
      // Small delay to make progress visible
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  };

  // Helper function to render the appropriate icon based on test name
  const getTestIcon = (testName: string) => {
    switch (testName) {
      case 'documents':
      case 'documentAccessControl':
        return <FileText className="h-4 w-4" />;
      case 'organizations':
      case 'organizationAccess':
        return <Building className="h-4 w-4" />;
      case 'patients':
      case 'patientAccess':
        return <User className="h-4 w-4" />;
      case 'writeOperations':
        return <Edit className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Helper to format test name for display
  const formatTestName = (testName: string) => {
    return testName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('RLS', 'RLS ')
      .replace('Access Control', 'Access');
  };

  const getTotalResults = () => {
    if (!results) return { passed: 0, failed: 0, total: 0 };
    
    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r.success).length;
    const failed = total - passed;
    
    return { passed, failed, total };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockCheck className="h-5 w-5" />
          RLS Policy Tester
        </CardTitle>
        <CardDescription>
          Test and validate Row Level Security policies for your multi-tenant system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{runningTest || "Running tests..."}</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {results && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Test Results Summary</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{getTotalResults().passed} Passed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{getTotalResults().failed} Failed</span>
                  </div>
                </div>
              </div>
              
              {getTotalResults().failed > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>RLS Policy Issues Detected</AlertTitle>
                  <AlertDescription>
                    Some tests failed. This could indicate security vulnerabilities in your application.
                    Please review the failed tests and fix the RLS policies as needed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="space-y-4">
              {Object.entries(results).map(([testName, result]) => (
                <div key={testName} className={`border rounded-md p-4 ${!result.success ? 'border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-800/20' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium flex items-center gap-2">
                      {getTestIcon(testName)}
                      {formatTestName(testName)}
                    </h3>
                    <Badge variant={result.success ? "default" : "destructive"} className="flex items-center gap-1">
                      {result.success ? 
                        <><ShieldCheck className="h-3 w-3" /> Passed</> : 
                        <><ShieldAlert className="h-3 w-3" /> Failed</>
                      }
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  
                  {/* Expandable details for tests with sub-results */}
                  {result.results && (
                    <div className="mt-2">
                      <button 
                        className="text-sm flex items-center gap-1 text-primary"
                        onClick={() => setExpandedTest(expandedTest === testName ? null : testName)}
                      >
                        {expandedTest === testName ? 'Hide details' : 'Show details'}
                        <ArrowRight className={`h-3 w-3 transition-transform ${expandedTest === testName ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {expandedTest === testName && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
                          {Object.entries(result.results).map(([subTestName, subResult]) => (
                            <div key={subTestName} className="text-sm">
                              <div className="flex items-center gap-2">
                                {subResult.success ? 
                                  <ShieldCheck className="h-3 w-3 text-green-500" /> : 
                                  <ShieldAlert className="h-3 w-3 text-red-500" />
                                }
                                <span className="font-medium">
                                  {subTestName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </span>
                              </div>
                              <p className="ml-5 text-muted-foreground">{subResult.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Row counts when available */}
                  {result.data && Array.isArray(result.data) && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Rows returned: {result.data.length}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-6 px-2"
                        onClick={() => setShowTestData(showTestData === testName ? null : testName)}
                      >
                        {showTestData === testName ? 'Hide data' : 'View data'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Data preview */}
                  {showTestData === testName && result.data && Array.isArray(result.data) && (
                    <div className="mt-2 text-xs overflow-x-auto">
                      <pre className="bg-slate-50 dark:bg-slate-900 p-2 rounded border text-xs max-h-40 overflow-y-auto">
                        {JSON.stringify(result.data.slice(0, 3), null, 2)}
                        {result.data.length > 3 && '\n... and ' + (result.data.length - 3) + ' more rows'}
                      </pre>
                    </div>
                  )}
                  
                  {/* Error details when available */}
                  {!result.success && result.error && (
                    <div className="mt-2 text-xs text-red-500">
                      <p className="font-medium">Error details:</p>
                      <pre className="bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800/30 mt-1 overflow-x-auto">
                        {typeof result.error === 'object' 
                          ? JSON.stringify(result.error, null, 2) 
                          : result.error}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {!results && !loading && (
          <div className="text-center py-4 text-muted-foreground">
            Click the button below to run RLS policy tests
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runTests} disabled={loading} className="w-full">
          {loading ? "Running Tests..." : "Test RLS Policies"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RlsTester;
