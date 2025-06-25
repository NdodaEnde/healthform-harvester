
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface RiskLevel {
  high: number;
  medium: number;
  low: number;
}

interface ComplianceData {
  compliant: number;
  nonCompliant: number;
  overdue: number;
  expiringIn30Days: number;
  total: number;
}

interface RestrictionsData {
  totalWithRestrictions: number;
  commonRestrictions: Array<{
    type: string;
    count: number;
  }>;
}

interface RiskComplianceAnalytics {
  riskLevels: RiskLevel;
  compliance: ComplianceData;
  restrictions: RestrictionsData;
}

export function useRiskComplianceAnalytics() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  return useQuery({
    queryKey: ['risk-compliance-analytics', organizationId],
    queryFn: async (): Promise<RiskComplianceAnalytics> => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      // Fetch medical examinations with test results
      const { data: examinations, error: examinationsError } = await supabase
        .from('medical_examinations')
        .select(`
          *,
          medical_test_results (*)
        `)
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`);

      if (examinationsError) throw examinationsError;

      const examinationData = examinations || [];
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Calculate risk levels based on test results and fitness status
      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;

      examinationData.forEach(exam => {
        const hasAbnormalResults = exam.medical_test_results?.some((test: any) => 
          test.test_result?.toLowerCase().includes('abnormal') ||
          test.test_result?.toLowerCase().includes('fail') ||
          test.test_result?.toLowerCase().includes('positive')
        );
        
        if (exam.fitness_status?.toLowerCase().includes('unfit') || hasAbnormalResults) {
          highRisk++;
        } else if (exam.fitness_status?.toLowerCase().includes('restriction') || 
                   exam.fitness_status?.toLowerCase().includes('condition')) {
          mediumRisk++;
        } else {
          lowRisk++;
        }
      });

      // Calculate compliance data
      const compliance: ComplianceData = {
        compliant: examinationData.filter(exam => 
          exam.expiry_date && new Date(exam.expiry_date) > currentDate
        ).length,
        nonCompliant: examinationData.filter(exam => 
          !exam.expiry_date || new Date(exam.expiry_date) <= currentDate
        ).length,
        overdue: examinationData.filter(exam => 
          exam.expiry_date && new Date(exam.expiry_date) < currentDate
        ).length,
        expiringIn30Days: examinationData.filter(exam => 
          exam.expiry_date && 
          new Date(exam.expiry_date) <= thirtyDaysFromNow &&
          new Date(exam.expiry_date) > currentDate
        ).length,
        total: examinationData.length
      };

      // Calculate restrictions data
      const restrictionCounts: { [key: string]: number } = {};
      const examsWithRestrictions = examinationData.filter(exam => 
        exam.restrictions && Array.isArray(exam.restrictions) && exam.restrictions.length > 0
      );

      examsWithRestrictions.forEach(exam => {
        if (exam.restrictions) {
          exam.restrictions.forEach((restriction: string) => {
            const normalizedRestriction = restriction.toLowerCase().trim();
            restrictionCounts[normalizedRestriction] = (restrictionCounts[normalizedRestriction] || 0) + 1;
          });
        }
      });

      const commonRestrictions = Object.entries(restrictionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([type, count]) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count
        }));

      return {
        riskLevels: {
          high: highRisk,
          medium: mediumRisk,
          low: lowRisk
        },
        compliance,
        restrictions: {
          totalWithRestrictions: examsWithRestrictions.length,
          commonRestrictions
        }
      };
    },
    enabled: !!organizationId,
  });
}
