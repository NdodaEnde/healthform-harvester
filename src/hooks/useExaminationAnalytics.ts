
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

interface ExaminationTypeData {
  preEmployment: number;
  periodical: number;
  exit: number;
}

interface FitnessStatusData {
  fit: number;
  fitWithRestriction: number;
  fitWithCondition: number;
  temporaryUnfit: number;
  unfit: number;
  total: number;
}

interface ExaminationAnalytics {
  examinationTypes: ExaminationTypeData;
  fitnessStatus: FitnessStatusData;
  totalExaminations: number;
  thisMonthExaminations: number;
  expiringCertificates: number;
  totalPatients: number;
}

export function useExaminationAnalytics() {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  return useQuery({
    queryKey: ['examination-analytics', organizationId],
    queryFn: async (): Promise<ExaminationAnalytics> => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      const { data, error } = await supabase
        .rpc('get_examination_analytics', { org_id: organizationId });

      if (error) throw error;

      // The RPC function returns an array with one row
      const result = data[0];

      if (!result) {
        // Return empty data structure if no results
        return {
          examinationTypes: {
            preEmployment: 0,
            periodical: 0,
            exit: 0
          },
          fitnessStatus: {
            fit: 0,
            fitWithRestriction: 0,
            fitWithCondition: 0,
            temporaryUnfit: 0,
            unfit: 0,
            total: 0
          },
          totalExaminations: 0,
          thisMonthExaminations: 0,
          expiringCertificates: 0,
          totalPatients: 0
        };
      }

      return {
        examinationTypes: {
          preEmployment: Number(result.pre_employment_count) || 0,
          periodical: Number(result.periodical_count) || 0,
          exit: Number(result.exit_count) || 0
        },
        fitnessStatus: {
          fit: Number(result.fit_count) || 0,
          fitWithRestriction: Number(result.fit_with_restriction_count) || 0,
          fitWithCondition: Number(result.fit_with_condition_count) || 0,
          temporaryUnfit: Number(result.temporary_unfit_count) || 0,
          unfit: Number(result.unfit_count) || 0,
          total: Number(result.total_examinations) || 0
        },
        totalExaminations: Number(result.total_examinations) || 0,
        thisMonthExaminations: Number(result.this_month_examinations) || 0,
        expiringCertificates: Number(result.expiring_certificates) || 0,
        totalPatients: Number(result.total_patients) || 0
      };
    },
    enabled: !!organizationId,
  });
}
