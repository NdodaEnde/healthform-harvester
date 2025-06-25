
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

      const { data, error } = await supabase
        .rpc('get_risk_compliance_analytics', { org_id: organizationId });

      if (error) throw error;

      // The RPC function returns an array with one row
      const result = data[0];

      if (!result) {
        // Return empty data structure if no results
        return {
          riskLevels: {
            high: 0,
            medium: 0,
            low: 0
          },
          compliance: {
            compliant: 0,
            nonCompliant: 0,
            overdue: 0,
            expiringIn30Days: 0,
            total: 0
          },
          restrictions: {
            totalWithRestrictions: 0,
            commonRestrictions: []
          }
        };
      }

      // Parse restriction types from JSONB
      const restrictionTypes = result.restriction_types || [];
      const commonRestrictions = Array.isArray(restrictionTypes) 
        ? restrictionTypes.map((item: any) => ({
            type: item.type || 'Unknown',
            count: Number(item.count) || 0
          }))
        : [];

      return {
        riskLevels: {
          high: Number(result.high_risk_count) || 0,
          medium: Number(result.medium_risk_count) || 0,
          low: Number(result.low_risk_count) || 0
        },
        compliance: {
          compliant: Number(result.compliant_count) || 0,
          nonCompliant: Number(result.non_compliant_count) || 0,
          overdue: Number(result.overdue_count) || 0,
          expiringIn30Days: Number(result.expiring_in_30_days_count) || 0,
          total: Number(result.total_examinations) || 0
        },
        restrictions: {
          totalWithRestrictions: Number(result.total_with_restrictions) || 0,
          commonRestrictions: commonRestrictions
        }
      };
    },
    enabled: !!organizationId,
  });
}
