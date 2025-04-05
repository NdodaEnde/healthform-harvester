import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, Filter, PlusCircle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FitnessCertificateStats } from "./components/FitnessCertificateStats";
import { StatsSummaryCards } from "./components/StatsSummaryCards";
import { OccupationalHealthMetricsChart } from "./components/OccupationalHealthMetricsChart";
import { OccupationalRestrictionsChart } from "./components/OccupationalRestrictionsChart";
import { TestTypeBreakdownCard } from "./components/TestTypeBreakdownCard";
import { CertificateComplianceCard } from "./components/CertificateComplianceCard";
import { ReportGeneratorCard } from "./components/ReportGeneratorCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { formatDistanceToNow, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ClinicalAnalyticsPage = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<"30" | "90" | "180" | "365" | "custom">("90");
  const [certificateTypes, setCertificateTypes] = useState<Record<string, number>>({});
  const [fitnessStatuses, setFitnessStatuses] = useState<Record<string, number>>({});
  const [restrictionTypes, setRestrictionTypes] = useState<Record<string, number>>({});

  const { data: documents, isLoading: isLoadingDocuments, error } = useQuery({
    queryKey: ['clinical-analytics-documents', dateRange],
    queryFn: async () => {
      const { from, to } = dateRange || { from: subDays(new Date(), 90), to: new Date() };
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'certificate-of-fitness')
        .gte('created_at', from!.toISOString())
        .lte('created_at', to!.toISOString());
      
      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!dateRange
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to fetch analytics data", {
        description: "Please try again later or contact support if the issue persists."
      });
    }
  }, [error]);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const certificateTypeCount: Record<string, number> = {};
      const fitnessStatusCount: Record<string, number> = {};
      const restrictionTypeCount: Record<string, number> = {};

      documents.forEach(doc => {
        // Process certificate types
        const docType = doc.document_type || "unknown";
        certificateTypeCount[docType] = (certificateTypeCount[docType] || 0) + 1;
        
        // Process fitness statuses
        if (doc.extracted_data) {
          try {
            const extractedData = typeof doc.extracted_data === 'string' 
              ? JSON.parse(doc.extracted_data)
              : doc.extracted_data;
            
            if (extractedData && typeof extractedData === 'object') {
              // Handle structured_data if it exists
              const structuredData = extractedData.structured_data || extractedData;
              
              if (structuredData && typeof structuredData === 'object') {
                // Process fitness status
                const certification = structuredData.certification;
                if (certification) {
                  if (certification.fit) {
                    fitnessStatusCount["Fit"] = (fitnessStatusCount["Fit"] || 0) + 1;
                  } else if (certification.fit_with_restrictions) {
                    fitnessStatusCount["Fit with Restrictions"] = (fitnessStatusCount["Fit with Restrictions"] || 0) + 1;
                  } else if (certification.fit_with_condition) {
                    fitnessStatusCount["Fit with Condition"] = (fitnessStatusCount["Fit with Condition"] || 0) + 1;
                  } else if (certification.temporarily_unfit) {
                    fitnessStatusCount["Temporarily Unfit"] = (fitnessStatusCount["Temporarily Unfit"] || 0) + 1;
                  } else if (certification.unfit) {
                    fitnessStatusCount["Unfit"] = (fitnessStatusCount["Unfit"] || 0) + 1;
                  } else {
                    fitnessStatusCount["Unknown"] = (fitnessStatusCount["Unknown"] || 0) + 1;
                  }
                }
                
                // Process restrictions
                const restrictions = structuredData.restrictions;
                if (restrictions) {
                  Object.entries(restrictions).forEach(([restriction, value]) => {
                    if (value === true) {
                      const displayName = restriction
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                      
                      restrictionTypeCount[displayName] = (restrictionTypeCount[displayName] || 0) + 1;
                    }
                  });
                }
              }
            }
          } catch (e) {
            console.error("Error processing document extracted data:", e);
          }
        }
      });

      setCertificateTypes(certificateTypeCount);
      setFitnessStatuses(fitnessStatusCount);
      setRestrictionTypes(restrictionTypeCount);
    }
  }, [documents]);

  const handleTimeframeChange = (value: string) => {
    const today = new Date();
    let from: Date;
    
    switch (value) {
      case "30":
        from = subDays(today, 30);
        setDateRange({ from, to: today });
        break;
      case "90":
        from = subDays(today, 90);
        setDateRange({ from, to: today });
        break;
      case "180":
        from = subDays(today, 180);
        setDateRange({ from, to: today });
        break;
      case "365":
        from = subDays(today, 365);
        setDateRange({ from, to: today });
        break;
      case "custom":
        // Keep the current dateRange, just change the UI state
        break;
    }
    
    setSelectedTimeframe(value as "30" | "90" | "180" | "365" | "custom");
  };

  const fitnessStatusColors = {
    "Fit": "#4ade80",
    "Fit with Restrictions": "#facc15",
    "Fit with Condition": "#fb923c",
    "Temporarily Unfit": "#f87171",
    "Unfit": "#ef4444",
    "Unknown": "#a1a1aa"
  };

  const fitnessStatusData = Object.entries(fitnessStatuses).map(([name, value]) => ({
    name,
    value,
    color: fitnessStatusColors[name as keyof typeof fitnessStatusColors] || "#a1a1aa"
  }));

  const restrictionTypesData = Object.entries(restrictionTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value
    }));

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Analytics</h1>
          <p className="text-muted-foreground">
            Analyze occupational health metrics and certificate compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="180">Last 180 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {selectedTimeframe === "custom" && (
              <DatePickerWithRange 
                date={dateRange} 
                onDateChange={setDateRange} 
              />
            )}
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {dateRange && (
        <div className="mb-6">
          <Badge variant="secondary" className="text-xs">
            <Calendar className="mr-1 h-3 w-3" />
            {dateRange.from ? dateRange.from.toLocaleDateString() : "Start date"} - {dateRange.to ? dateRange.to.toLocaleDateString() : "End date"}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsSummaryCards 
          totalDocuments={documents?.length || 0}
          isLoading={isLoadingDocuments}
          fitnessStatuses={fitnessStatuses}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Fitness Certificate Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of fitness statuses across all certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingDocuments ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fitnessStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {fitnessStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} certificates`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Restriction Types</CardTitle>
            <CardDescription>
              Most common restrictions applied in fitness certificates
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingDocuments ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={restrictionTypesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <OccupationalHealthMetricsChart 
          isLoading={isLoadingDocuments}
          dateRange={dateRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TestTypeBreakdownCard 
          isLoading={isLoadingDocuments}
          documents={documents || []}
        />
        <CertificateComplianceCard 
          isLoading={isLoadingDocuments}
          documents={documents || []}
        />
        <ReportGeneratorCard />
      </div>
    </div>
  );
};

export default ClinicalAnalyticsPage;
