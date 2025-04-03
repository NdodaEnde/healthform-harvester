
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
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";

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
    "mandatory" | "specialized" | "follow-up"
  >("mandatory");

  // Sample data for different test categories
  const mandatoryTests = [
    {
      name: "Vision Assessment",
      count: 1248,
      completion: 98,
      status: "high",
      description: "Visual acuity, color vision, depth perception",
    },
    {
      name: "Hearing Test",
      count: 1156,
      completion: 95,
      status: "high",
      description: "Audiometry, speech discrimination",
    },
    {
      name: "Lung Function",
      count: 987,
      completion: 92,
      status: "high",
      description: "Spirometry, peak flow measurement",
    },
    {
      name: "Blood Pressure",
      count: 876,
      completion: 99,
      status: "high",
      description: "Systolic and diastolic measurements",
    },
    {
      name: "Drug Screen",
      count: 945,
      completion: 96,
      status: "high",
      description: "Substance detection and analysis",
    },
    {
      name: "Working at Heights",
      count: 823,
      completion: 94,
      status: "high",
      description: "Balance, vertigo and spatial awareness",
    },
    {
      name: "BMI Assessment",
      count: 754,
      completion: 97,
      status: "high",
      description: "Height, weight, body mass calculation",
    },
  ];

  const specializedTests = [
    {
      name: "Chest X-Ray",
      count: 543,
      completion: 87,
      status: "medium",
      description: "Pulmonary function assessment",
    },
    {
      name: "ECG",
      count: 487,
      completion: 85,
      status: "medium",
      description: "Cardiac electrical activity",
    },
    {
      name: "Blood Tests",
      count: 632,
      completion: 90,
      status: "high",
      description: "Complete blood count, lipid profile",
    },
    {
      name: "Drug Screen (Extended)",
      count: 428,
      completion: 88,
      status: "medium",
      description: "Comprehensive substance panel",
    },
    {
      name: "Urinalysis",
      count: 598,
      completion: 88,
      status: "medium",
      description: "Kidney function, diabetes screening",
    },
    {
      name: "Liver Function",
      count: 412,
      completion: 82,
      status: "medium",
      description: "AST, ALT, bilirubin levels",
    },
  ];

  const followUpTests = [
    {
      name: "Repeat Vision",
      count: 187,
      completion: 76,
      status: "medium",
      description: "Follow-up for borderline results",
    },
    {
      name: "Repeat Hearing",
      count: 156,
      completion: 72,
      status: "medium",
      description: "Confirmation of hearing thresholds",
    },
    {
      name: "Extended Lung Function",
      count: 134,
      completion: 68,
      status: "low",
      description: "Detailed respiratory assessment",
    },
    {
      name: "Heights Reassessment",
      count: 112,
      completion: 70,
      status: "medium",
      description: "Detailed balance and vertigo testing",
    },
    {
      name: "Stress ECG",
      count: 98,
      completion: 65,
      status: "low",
      description: "Cardiac function under exertion",
    },
    {
      name: "Specialist Referrals",
      count: 76,
      completion: 58,
      status: "low",
      description: "Ophthalmology, cardiology, pulmonology",
    },
  ];

  const getActiveTests = () => {
    switch (activeTab) {
      case "mandatory":
        return mandatoryTests;
      case "specialized":
        return specializedTests;
      case "follow-up":
        return followUpTests;
      default:
        return mandatoryTests;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircleIcon className="mr-1 h-3 w-3" /> High Priority
          </Badge>
        );

      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <AlertCircleIcon className="mr-1 h-3 w-3" /> Medium Priority
          </Badge>
        );

      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <AlertCircleIcon className="mr-1 h-3 w-3" /> Low Priority
          </Badge>
        );

      default:
        return null;
    }
  };

  const getProgressColor = (completion: number) => {
    if (completion >= 90) return "var(--chart-2)";
    if (completion >= 75) return "var(--chart-3)";
    return "var(--chart-5)";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "mandatory" | "specialized" | "follow-up")
          }
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mandatory">Mandatory Tests</TabsTrigger>
            <TabsTrigger value="specialized">Specialized Tests</TabsTrigger>
            <TabsTrigger value="follow-up">Follow-up Tests</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {getActiveTests().map((test, index) => (
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
                  "--progress-foreground": `hsl(${getProgressColor(test.completion)})` 
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
