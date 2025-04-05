
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

interface StatsSummaryCardsProps {
  className?: string;
  totalDocuments?: number;
  isLoading?: boolean;
  fitnessStatuses?: Record<string, number>;
}

export default function StatsSummaryCards({ 
  className, 
  totalDocuments: propsTotalDocuments, 
  isLoading: propsIsLoading,
  fitnessStatuses: propsFitnessStatuses 
}: StatsSummaryCardsProps) {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  // Fetch data only if not provided via props
  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && propsTotalDocuments === undefined,
  });

  // Calculate fitness statuses
  const calculatedFitnessStatuses = React.useMemo(() => {
    if (propsFitnessStatuses) return propsFitnessStatuses;
    
    if (!documentsData) return {
      "Fit": 0,
      "Fit with Restrictions": 0,
      "Temporarily Unfit": 0,
      "Permanently Unfit": 0,
      "Unknown": 0
    };
    
    const statuses = {
      "Fit": 0,
      "Fit with Restrictions": 0,
      "Temporarily Unfit": 0,
      "Permanently Unfit": 0,
      "Unknown": 0
    };
    
    documentsData.forEach(doc => {
      try {
        const extractedData = doc.extracted_data?.structured_data?.certification || {};
        
        if (extractedData.fit || extractedData.fit_for_duty) {
          statuses['Fit']++;
        } else if (extractedData.fit_with_restrictions) {
          statuses['Fit with Restrictions']++;
        } else if (extractedData.temporarily_unfit) {
          statuses['Temporarily Unfit']++;
        } else if (extractedData.unfit || extractedData.permanently_unfit) {
          statuses['Permanently Unfit']++;
        } else {
          statuses['Unknown']++;
        }
      } catch (err) {
        statuses['Unknown']++;
      }
    });
    
    return statuses;
  }, [documentsData, propsFitnessStatuses]);
  
  // Calculate totals
  const totalDocuments = propsTotalDocuments || documentsData?.length || 0;
  const totalFit = calculatedFitnessStatuses["Fit"] || 0;
  const totalWithRestrictions = calculatedFitnessStatuses["Fit with Restrictions"] || 0;
  const totalMedicalTests = Math.round(totalDocuments * 1.76); // Simple calculation for example
  
  const isLoading = propsIsLoading || isLoadingDocuments;
  
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate percentages
  const percentageFit = totalDocuments > 0 ? ((totalFit / totalDocuments) * 100).toFixed(1) + '%' : '0%';
  const percentageRestrictions = totalDocuments > 0 ? ((totalWithRestrictions / totalDocuments) * 100).toFixed(1) + '%' : '0%';
  
  // Sample growth statistics (in a real app, these would be calculated from historical data)
  const growthAssessments = '+12%';
  const growthTests = '+8.2%';

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalDocuments.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {growthAssessments} from previous period
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Fit for Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalFit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {percentageFit} of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            With Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalWithRestrictions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {percentageRestrictions} of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Medical Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalMedicalTests.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {growthTests} from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
