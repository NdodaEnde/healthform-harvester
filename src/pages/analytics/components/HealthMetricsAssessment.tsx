
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OccupationalHealthMetricsChart from "./OccupationalHealthMetricsChart";

export default function HealthMetricsAssessment() {
  const [activeMetric, setActiveMetric] = useState("vision");

  return (
    <div className="space-y-4">
      <Tabs
        value={activeMetric}
        onValueChange={setActiveMetric}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vision">Vision Assessment</TabsTrigger>
          <TabsTrigger value="hearing">Hearing Assessment</TabsTrigger>
          <TabsTrigger value="lung">Lung Function</TabsTrigger>
          <TabsTrigger value="overall">Overall Fitness</TabsTrigger>
        </TabsList>

        <TabsContent value="vision" className="mt-4">
          <OccupationalHealthMetricsChart 
            metricType="vision"
            title="Vision Assessment"
            description="Detailed analysis of vision metrics including near, far and perception tests"
          />
        </TabsContent>

        <TabsContent value="hearing" className="mt-4">
          <OccupationalHealthMetricsChart 
            metricType="hearing"
            title="Hearing Assessment"
            description="Hearing capacity analysis for both ears and noise exposure metrics"
          />
        </TabsContent>

        <TabsContent value="lung" className="mt-4">
          <OccupationalHealthMetricsChart 
            metricType="lung"
            title="Lung Function Assessment"
            description="Respiratory capacity measurements including FVC, FEV1 and other key metrics"
          />
        </TabsContent>

        <TabsContent value="overall" className="mt-4">
          <OccupationalHealthMetricsChart 
            metricType="overall"
            title="Overall Fitness Status"
            description="Summary of employee fitness categories and compliance status"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
