
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AlertTriangle, Clock, CheckCircle, Calendar, Users } from 'lucide-react';

const ComplianceMonitoring = () => {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();

  // Fetch medical examinations with expiry data
  const { data: examinations, isLoading } = useQuery({
    queryKey: ['compliance-monitoring', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_examinations')
        .select(`
          id,
          patient_id,
          examination_date,
          expiry_date,
          fitness_status,
          company_name,
          patients!inner(first_name, last_name, id_number)
        `)
        .or(`organization_id.eq.${organizationId},client_organization_id.eq.${organizationId}`)
        .not('expiry_date', 'is', null)
        .order('expiry_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate compliance metrics
  const complianceMetrics = React.useMemo(() => {
    if (!examinations) return null;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expired = examinations.filter(exam => new Date(exam.expiry_date) < now);
    const expiring30 = examinations.filter(exam => {
      const expiryDate = new Date(exam.expiry_date);
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow;
    });
    const expiring60 = examinations.filter(exam => {
      const expiryDate = new Date(exam.expiry_date);
      return expiryDate > thirtyDaysFromNow && expiryDate <= sixtyDaysFromNow;
    });
    const expiring90 = examinations.filter(exam => {
      const expiryDate = new Date(exam.expiry_date);
      return expiryDate > sixtyDaysFromNow && expiryDate <= ninetyDaysFromNow;
    });

    const overdue = expired.length;
    const totalCertificates = examinations.length;
    const complianceRate = totalCertificates > 0 ? ((totalCertificates - overdue) / totalCertificates * 100) : 100;

    return {
      expired,
      expiring30,
      expiring60,
      expiring90,
      overdue,
      totalCertificates,
      complianceRate: Math.round(complianceRate * 10) / 10
    };
  }, [examinations]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!complianceMetrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No compliance data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {complianceMetrics.expired.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical:</strong> {complianceMetrics.expired.length} expired certificates require immediate attention!
          </AlertDescription>
        </Alert>
      )}

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={complianceMetrics.complianceRate >= 95 ? "border-green-200" : complianceMetrics.complianceRate >= 80 ? "border-yellow-200" : "border-red-200"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {complianceMetrics.totalCertificates - complianceMetrics.overdue} of {complianceMetrics.totalCertificates} valid
            </p>
          </CardContent>
        </Card>

        <Card className={complianceMetrics.overdue > 0 ? "border-red-200" : "border-green-200"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceMetrics.overdue}</div>
            <p className="text-xs text-muted-foreground">Expired certificates</p>
          </CardContent>
        </Card>

        <Card className={complianceMetrics.expiring30.length > 0 ? "border-orange-200" : "border-green-200"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Expiring Soon (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{complianceMetrics.expiring30.length}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming (60-90d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.expiring60.length + complianceMetrics.expiring90.length}</div>
            <p className="text-xs text-muted-foreground">Plan ahead</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expiration Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expired Certificates */}
        {complianceMetrics.expired.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expired Certificates ({complianceMetrics.expired.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {complianceMetrics.expired.slice(0, 10).map((exam) => (
                  <div key={exam.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <div>
                      <div className="font-medium text-sm">
                        {exam.patients?.first_name} {exam.patients?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exam.company_name} • ID: {exam.patients?.id_number}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Expired {Math.floor((new Date().getTime() - new Date(exam.expiry_date).getTime()) / (1000 * 60 * 60 * 24))}d ago
                    </Badge>
                  </div>
                ))}
                {complianceMetrics.expired.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{complianceMetrics.expired.length - 10} more expired certificates
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Soon */}
        {complianceMetrics.expiring30.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Expiring in 30 Days ({complianceMetrics.expiring30.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {complianceMetrics.expiring30.slice(0, 10).map((exam) => (
                  <div key={exam.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <div>
                      <div className="font-medium text-sm">
                        {exam.patients?.first_name} {exam.patients?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {exam.company_name} • ID: {exam.patients?.id_number}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-orange-300">
                      {Math.ceil((new Date(exam.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d left
                    </Badge>
                  </div>
                ))}
                {complianceMetrics.expiring30.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{complianceMetrics.expiring30.length - 10} more expiring soon
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComplianceMonitoring;
