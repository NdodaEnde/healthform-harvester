import React from 'react';
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

  // Process documents to extract test type information based on actual test structure
  const testTypes = React.useMemo(() => {
    if (!documentsData) return [];

    const testCounts: { [key: string]: { total: number, completed: number } } = {};

    documentsData.forEach(doc => {
      try {
        const extractedData = doc.extracted_data;
        if (!extractedData || typeof extractedData !== 'object') return;

        const structuredData = (extractedData as any).structured_data;
        if (!structuredData || typeof structuredData !== 'object') return;

        const testResults = structuredData.examination_results?.test_results;
        if (!testResults || typeof testResults !== 'object') return;

        // Map actual test fields from your medical examination structure
        const testMapping = {
          'Blood Tests': {
            done: testResults.bloods_done,
            results: testResults.bloods_results
          },
          'Vision Tests': {
            // Combine all vision-related tests
            done: testResults.far_near_vision_done || testResults.night_vision_done || testResults.side_depth_done,
            results: testResults.far_near_vision_results || testResults.night_vision_results || testResults.side_depth_results
          },
          'Hearing Tests': {
            done: testResults.hearing_done,
            results: testResults.hearing_results
          },
          'Working At Heights': {
            done: testResults.heights_done || testResults.working_at_heights_done,
            results: testResults.heights_results || testResults.working_at_heights_results
          },
          'Lung Function': {
            done: testResults.lung_function_done,
            results: testResults.lung_function_results
          },
          'Drug Screen': {
            done: testResults.drug_screen_done,
            results: testResults.drug_screen_results
          },
          'X-Ray': {
            done: testResults.x_ray_done,
            results: testResults.x_ray_results
          }
        };

        Object.entries(testMapping).forEach(([testName, testData]) => {
          // Only count if the test was actually done or has results
          if (testData.done === true || (testData.results && testData.results !== 'N/A')) {
            if (!testCounts[testName]) {
              testCounts[testName] = { total: 0, completed: 0 };
            }
            testCounts[testName].total++;
            
            // Test is completed if it was done and has meaningful results
            if (testData.done === true && testData.results && 
                testData.results !== 'N/A' && testData.results.toString().trim() !== '') {
              testCounts[testName].completed++;
            }
          }
        });

      } catch (err) {
        console.error('Error processing document for test breakdown:', err);
      }
    });

    return Object.entries(testCounts).map(([name, data]) => ({
      name,
      count: data.total,
      completion: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      status: data.total > 0 ? (Math.round((data.completed / data.total) * 100) >= 90 ? 'high' : Math.round((data.completed / data.total) * 100) >= 75 ? 'medium' : 'low') : 'low',
      description: getTestDescription(name)
    })).sort((a, b) => b.count - a.count);

  }, [documentsData]);

  function getTestDescription(testType: string): string {
    const descriptions: { [key: string]: string } = {
      'Blood Tests': 'Blood analysis and laboratory work',
      'Vision Tests': 'Visual acuity, night vision, peripheral vision',
      'Hearing Tests': 'Auditory function assessment',
      'Working At Heights': 'Balance and spatial awareness evaluation',
      'Lung Function': 'Spirometry and respiratory assessment',
      'Drug Screen': 'Substance detection and analysis',
      'X-Ray': 'Radiological examination'
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
