
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { CheckCircleIcon, AlertCircleIcon, Loader2 } from "lucide-react";

interface TestTypeBreakdownCardProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function TestTypeBreakdownCard({
  className,
  title = "Medical Test Type Breakdown",
  description = "Detailed breakdown of medical examination tests by category",
}: TestTypeBreakdownCardProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "recent" | "follow-up"
  >("all");

  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch documents with extracted medical test data
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents-test-breakdown', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('extracted_data, created_at, status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .eq('status', 'processed')
        .not('extracted_data', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Process documents to extract test type information
  const testTypes = React.useMemo(() => {
    if (!documentsData) return [];

    const testCounts: { [key: string]: { total: number, completed: number, required: boolean } } = {};

    documentsData.forEach(doc => {
      try {
        const extractedData = doc.extracted_data;
        if (!extractedData || typeof extractedData !== 'object') return;

        const structuredData = (extractedData as any).structured_data;
        if (!structuredData || typeof structuredData !== 'object') return;

        // Check various test types in the structured data
        const tests = structuredData.tests || structuredData.medical_tests || {};
        
        // Common test types to look for
        const testTypeMapping = {
          'vision': ['vision', 'visual_acuity', 'eye_test'],
          'hearing': ['hearing', 'audiometry', 'audio'],
          'lung_function': ['lung', 'spirometry', 'respiratory'],
          'blood_pressure': ['blood_pressure', 'bp', 'cardiovascular'],
          'drug_screen': ['drug', 'substance', 'alcohol'],
          'heights': ['height', 'working_at_heights', 'vertigo'],
          'bmi': ['bmi', 'weight', 'body_mass'],
          'chest_xray': ['chest', 'xray', 'x_ray'],
          'ecg': ['ecg', 'ekg', 'cardiac'],
          'blood_tests': ['blood_test', 'blood_work', 'laboratory']
        };

        Object.entries(testTypeMapping).forEach(([testType, keywords]) => {
          const testData = keywords.find(keyword => tests[keyword] !== undefined);
          
          if (testData || keywords.some(keyword => 
            JSON.stringify(structuredData).toLowerCase().includes(keyword)
          )) {
            if (!testCounts[testType]) {
              testCounts[testType] = { total: 0, completed: 0, required: true };
            }
            testCounts[testType].total++;
            
            // Check if test was completed/passed
            const testResult = tests[testData || keywords[0]];
            if (testResult && (
              testResult === 'pass' || 
              testResult === 'normal' || 
              testResult === 'completed' ||
              (typeof testResult === 'object' && testResult.status === 'completed')
            )) {
              testCounts[testType].completed++;
            }
          }
        });

      } catch (err) {
        console.error('Error processing document for test breakdown:', err);
      }
    });

    return Object.entries(testCounts).map(([name, data]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: data.total,
      completion: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      status: data.completion >= 90 ? 'high' : data.completion >= 75 ? 'medium' : 'low',
      description: getTestDescription(name)
    })).sort((a, b) => b.count - a.count);

  }, [documentsData]);

  function getTestDescription(testType: string): string {
    const descriptions: { [key: string]: string } = {
      'vision': 'Visual acuity, color vision, depth perception',
      'hearing': 'Audiometry, speech discrimination',
      'lung_function': 'Spirometry, peak flow measurement',
      'blood_pressure': 'Systolic and diastolic measurements',
      'drug_screen': 'Substance detection and analysis',
      'heights': 'Balance, vertigo and spatial awareness',
      'bmi': 'Height, weight, body mass calculation',
      'chest_xray': 'Pulmonary function assessment',
      'ecg': 'Cardiac electrical activity',
      'blood_tests': 'Complete blood count, lipid profile'
    };
    return descriptions[testType] || 'Medical assessment';
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircleIcon className="mr-1 h-3 w-3" /> High Completion
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <AlertCircleIcon className="mr-1 h-3 w-3" /> Medium Completion
          </Badge>
        );
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertCircleIcon className="mr-1 h-3 w-3" /> Low Completion
          </Badge>
        );
      default:
        return null;
    }
  };

  const getProgressColor = (completion: number) => {
    if (completion >= 90) return "hsl(var(--chart-2))";
    if (completion >= 75) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-5))";
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Test Breakdown...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredTests = testTypes.filter(test => {
    switch (activeTab) {
      case "recent":
        return test.completion >= 75;
      case "follow-up":
        return test.completion < 75;
      default:
        return true;
    }
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "all" | "recent" | "follow-up")
          }
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Tests</TabsTrigger>
            <TabsTrigger value="recent">High Completion</TabsTrigger>
            <TabsTrigger value="follow-up">Needs Follow-up</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredTests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {activeTab === "all" 
                ? "No test data available" 
                : activeTab === "recent"
                ? "No tests with high completion rates"
                : "No tests requiring follow-up"
              }
            </div>
          ) : (
            filteredTests.map((test, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{test.name}</span>
                      {getStatusBadge(test.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {test.description}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{test.count} tests</div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Completion Rate</span>
                  <span>{test.completion}%</span>
                </div>
                <Progress
                  value={test.completion}
                  className="h-2 bg-muted"
                  style={{ 
                    "--progress-foreground": getProgressColor(test.completion)
                  } as React.CSSProperties}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
