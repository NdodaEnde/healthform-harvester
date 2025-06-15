
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Loader2 } from "lucide-react";

interface StatsSummaryCardsProps {
  className?: string;
}

export default function StatsSummaryCards({ className }: StatsSummaryCardsProps) {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  // Fetch patients data
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('client_organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch documents data
  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['documents-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .eq('status', 'processed');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch medical examinations data
  const { data: examinationsData, isLoading: isLoadingExaminations } = useQuery({
    queryKey: ['examinations-summary', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_examinations')
        .select('*')
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate fitness statuses from real data
  const fitnessStatuses = React.useMemo(() => {
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
        const extractedData = doc.extracted_data;
        if (!extractedData || typeof extractedData !== 'object' || Array.isArray(extractedData)) {
          statuses['Unknown']++;
          return;
        }
        
        const structuredData = extractedData.structured_data;
        if (!structuredData || typeof structuredData !== 'object' || Array.isArray(structuredData)) {
          statuses['Unknown']++;
          return;
        }
        
        const certification = structuredData.certification;
        if (!certification || typeof certification !== 'object' || Array.isArray(certification)) {
          statuses['Unknown']++;
          return;
        }
        
        if (certification.fit || certification.fit_for_duty) {
          statuses['Fit']++;
        } else if (certification.fit_with_restrictions) {
          statuses['Fit with Restrictions']++;
        } else if (certification.temporarily_unfit) {
          statuses['Temporarily Unfit']++;
        } else if (certification.unfit || certification.permanently_unfit) {
          statuses['Permanently Unfit']++;
        } else {
          statuses['Unknown']++;
        }
      } catch (err) {
        statuses['Unknown']++;
      }
    });
    
    return statuses;
  }, [documentsData]);
  
  // Calculate totals from real data
  const totalAssessments = documentsData?.length || 0;
  const totalPatients = patientsData?.length || 0;
  const totalFit = fitnessStatuses["Fit"] || 0;
  const totalWithRestrictions = fitnessStatuses["Fit with Restrictions"] || 0;
  const totalMedicalTests = examinationsData?.length || 0;
  
  const isLoading = isLoadingPatients || isLoadingDocuments || isLoadingExaminations;
  
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
  const percentageFit = totalAssessments > 0 ? ((totalFit / totalAssessments) * 100).toFixed(1) + '%' : '0%';
  const percentageRestrictions = totalAssessments > 0 ? ((totalWithRestrictions / totalAssessments) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalPatients.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Registered patients
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Assessments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalAssessments.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Processed documents
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
            {percentageFit} of assessments
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
            {percentageRestrictions} of assessments
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
