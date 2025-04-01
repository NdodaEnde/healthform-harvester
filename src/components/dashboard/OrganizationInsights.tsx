
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Progress } from "@/components/ui/progress";

export function OrganizationInsights({ organizationId }: { organizationId: string | null }) {
  const { clientOrganizations, isServiceProvider } = useOrganization();
  
  const { data: insightsData, isLoading } = useQuery({
    queryKey: ['organization-insights', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // If not a service provider, return simplified data
      if (!isServiceProvider()) {
        return {
          activeClients: 0,
          totalCertificates: 0,
          expiringCertificates: 0,
          complianceRate: 92 // Default placeholder value
        };
      }
      
      // For service providers, get client organizations data
      const clientOrgIds = clientOrganizations.map(org => org.id);
      
      // Count total certificates across all client organizations
      let totalCertificates = 0;
      let expiringCertificates = 0;
      
      if (clientOrgIds.length > 0) {
        // Get total certificates
        const { count: certCount, error: certError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('organization_id', clientOrgIds)
          .eq('document_type', 'certificate');
        
        if (certError) throw certError;
        totalCertificates = certCount || 0;
        
        // Get expiring certificates (next 30 days)
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        const { count: expiringCount, error: expiringError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('organization_id', clientOrgIds)
          .eq('document_type', 'certificate')
          .lt('expiry_date', thirtyDaysLater.toISOString())
          .gt('expiry_date', new Date().toISOString());
        
        if (expiringError) throw expiringError;
        expiringCertificates = expiringCount || 0;
      }
      
      // Calculate compliance rate
      const complianceRate = totalCertificates > 0 
        ? Math.round(((totalCertificates - expiringCertificates) / totalCertificates) * 100) 
        : 100;
      
      return {
        activeClients: clientOrgIds.length,
        totalCertificates,
        expiringCertificates,
        complianceRate
      };
    },
    enabled: !!organizationId
  });
  
  // If not a service provider, don't show this component
  if (!isServiceProvider() && !isLoading) {
    return null;
  }

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader>
        <CardTitle>Organization Insights</CardTitle>
        <CardDescription>
          Overview of client organizations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Active Clients</span>
              </div>
              <span className="font-bold">{insightsData?.activeClients || 0}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Compliance Rate</span>
                </div>
                <span className="font-bold">{insightsData?.complianceRate || 0}%</span>
              </div>
              <Progress value={insightsData?.complianceRate || 0} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Expiring Certificates</span>
              </div>
              <span className="font-bold">{insightsData?.expiringCertificates || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total Certificates</span>
              </div>
              <span className="font-bold">{insightsData?.totalCertificates || 0}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
