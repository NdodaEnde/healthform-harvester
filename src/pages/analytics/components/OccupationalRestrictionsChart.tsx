import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

interface OccupationalRestrictionsChartProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function OccupationalRestrictionsChart({
  title = "Workplace Restrictions Analysis",
  description = "Distribution of workplace restrictions from health assessments",
  className,
}: OccupationalRestrictionsChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [dataType, setDataType] = useState("restrictions");

  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch medical examinations with restrictions data
  const { data: examinationsData, isLoading } = useQuery({
    queryKey: ['restrictions-analysis', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('restrictions, follow_up_actions, fitness_status')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .not('restrictions', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch documents for additional restriction data
  const { data: documentsData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents-restrictions', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('extracted_data')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .eq('status', 'processed')
        .not('extracted_data', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Process data to extract restrictions and protection requirements
  const chartData = React.useMemo(() => {
    if (!examinationsData && !documentsData) return [];

    const restrictionCounts: { [key: string]: number } = {};
    const protectionCounts: { [key: string]: number } = {};

    // Process medical examinations restrictions
    examinationsData?.forEach(exam => {
      if (exam.restrictions && Array.isArray(exam.restrictions)) {
        exam.restrictions.forEach((restriction: string) => {
          const key = restriction.toLowerCase();
          restrictionCounts[key] = (restrictionCounts[key] || 0) + 1;
        });
      }
    });

    // Process documents for additional restriction data
    documentsData?.forEach(doc => {
      try {
        const extractedData = doc.extracted_data as any;
        if (!extractedData?.structured_data) return;

        const structuredData = extractedData.structured_data;
        
        // Look for restrictions in various formats
        const restrictions = structuredData.restrictions || 
                           structuredData.workplace_restrictions || 
                           structuredData.limitations || [];

        if (Array.isArray(restrictions)) {
          restrictions.forEach((restriction: string) => {
            const key = restriction.toLowerCase();
            restrictionCounts[key] = (restrictionCounts[key] || 0) + 1;
          });
        }

        // Look for protection requirements
        const protections = structuredData.required_protections || 
                          structuredData.ppe_requirements || 
                          structuredData.protective_equipment || [];

        if (Array.isArray(protections)) {
          protections.forEach((protection: string) => {
            const key = protection.toLowerCase();
            protectionCounts[key] = (protectionCounts[key] || 0) + 1;
          });
        }

        // Extract specific protection requirements from text
        const followUp = structuredData.follow_up_actions || '';
        if (typeof followUp === 'string') {
          if (followUp.toLowerCase().includes('spectacles') || followUp.toLowerCase().includes('glasses')) {
            protectionCounts['wear spectacles'] = (protectionCounts['wear spectacles'] || 0) + 1;
          }
          if (followUp.toLowerCase().includes('hearing protection')) {
            protectionCounts['hearing protection'] = (protectionCounts['hearing protection'] || 0) + 1;
          }
          if (followUp.toLowerCase().includes('dust protection') || followUp.toLowerCase().includes('respiratory')) {
            protectionCounts['dust protection'] = (protectionCounts['dust protection'] || 0) + 1;
          }
        }

      } catch (err) {
        console.error('Error processing document restrictions:', err);
      }
    });

    const counts = dataType === "restrictions" ? restrictionCounts : protectionCounts;
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (total === 0) return [];

    return Object.entries(counts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
        value: Math.round((count / total) * 100),
        count,
        color: `hsl(var(--chart-${(Object.keys(counts).indexOf(name) % 6) + 1}))`
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 items

  }, [examinationsData, documentsData, dataType]);

  // Chart config for colors
  const chartConfig = {
    1: { theme: { light: "hsl(var(--chart-1))", dark: "hsl(var(--chart-1))" } },
    2: { theme: { light: "hsl(var(--chart-2))", dark: "hsl(var(--chart-2))" } },
    3: { theme: { light: "hsl(var(--chart-3))", dark: "hsl(var(--chart-3))" } },
    4: { theme: { light: "hsl(var(--chart-4))", dark: "hsl(var(--chart-4))" } },
    5: { theme: { light: "hsl(var(--chart-5))", dark: "hsl(var(--chart-5))" } },
    6: { theme: { light: "hsl(var(--chart-6))", dark: "hsl(var(--chart-6))" } },
  };

  if (isLoading || isLoadingDocs) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Restrictions Analysis...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div>
          <Select value={dataType} onValueChange={setDataType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restrictions">Workplace Restrictions</SelectItem>
              <SelectItem value="protections">Protection Requirements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === "pie"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1 text-sm rounded-md ${
                chartType === "bar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Bar
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No {dataType} data available
          </div>
        ) : (
          <>
            {chartType === "pie" ? (
              <ChartContainer config={chartConfig} className="aspect-[none] h-[350px]">
                <PieChart>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [`${value}% (${chartData.find(d => d.name === name)?.count || 0} cases)`, name]}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-[none] h-[350px]">
                <BarChart data={chartData}>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [`${value}% (${chartData.find(d => d.name === name)?.count || 0} cases)`, name]}
                  />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 10, right: 10 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={4}
                    barSize={40}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="mr-2 h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">
                    {entry.name}: {entry.value}% ({entry.count})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
