
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rlsTester } from "@/utils/rls-tester";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

type TestResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

const RlsTester = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, TestResult> | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const testResults = await rlsTester.runAllTests();
      setResults(testResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RLS Policy Tester
        </CardTitle>
        <CardDescription>
          Test and validate Row Level Security policies for your multi-tenant system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {results && (
          <div className="space-y-4">
            {Object.entries(results).map(([testName, result]) => (
              <div key={testName} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                  <Badge variant={result.success ? "success" : "destructive"} className="flex items-center gap-1">
                    {result.success ? 
                      <><ShieldCheck className="h-3 w-3" /> Passed</> : 
                      <><ShieldAlert className="h-3 w-3" /> Failed</>
                    }
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </div>
            ))}
          </div>
        )}
        {!results && (
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
