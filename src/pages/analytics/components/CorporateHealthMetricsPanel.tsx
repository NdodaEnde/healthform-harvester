
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Building2, HardHat, AlertOctagon, CheckCircle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CorporateHealthMetricsPanelProps {
  className?: string;
}

export default function CorporateHealthMetricsPanel({ className }: CorporateHealthMetricsPanelProps) {
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  
  // Fetch patients data for analytics
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients-analytics', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Calculate job role/department distribution
  const jobRoleDistribution = React.useMemo(() => {
    if (!patientsData) return {};
    
    const distribution: Record<string, number> = {};
    
    patientsData.forEach(patient => {
      if (patient.contact_info && typeof patient.contact_info === 'object') {
        const contactInfo = patient.contact_info as any;
        const department = contactInfo.company || 'Unknown';
        const role = contactInfo.occupation || 'Unknown';
        
        // Count by occupation
        distribution[role] = (distribution[role] || 0) + 1;
      }
    });
    
    return distribution;
  }, [patientsData]);

  // Calculate risk category breakdown (simulation based on job roles)
  const riskCategoryBreakdown = React.useMemo(() => {
    if (!patientsData) return { 'High Risk': 0, 'Medium Risk': 0, 'Low Risk': 0 };
    
    const breakdown = {
      'High Risk': 0,
      'Medium Risk': 0,
      'Low Risk': 0
    };
    
    // Simplified risk categorization based on occupation keywords
    // In a real app, this would use more sophisticated classification
    patientsData.forEach(patient => {
      if (patient.contact_info && typeof patient.contact_info === 'object') {
        const contactInfo = patient.contact_info as any;
        const occupation = (contactInfo.occupation || '').toLowerCase();
        
        if (occupation.includes('field') || 
            occupation.includes('driver') || 
            occupation.includes('operator') ||
            occupation.includes('technician')) {
          breakdown['High Risk']++;
        } else if (occupation.includes('supervisor') || 
                  occupation.includes('manager') || 
                  occupation.includes('lead')) {
          breakdown['Medium Risk']++;
        } else {
          breakdown['Low Risk']++;
        }
      } else {
        breakdown['Low Risk']++;
      }
    });
    
    return breakdown;
  }, [patientsData]);

  // Calculate health assessment completion status
  const healthAssessmentStatus = React.useMemo(() => {
    if (!patientsData) return { completed: 0, upcoming: 0, overdue: 0, total: 0 };
    
    const status = {
      completed: 0,
      upcoming: 0,
      overdue: 0,
      total: patientsData.length
    };
    
    const now = new Date();
    
    patientsData.forEach(patient => {
      if (patient.medical_history && typeof patient.medical_history === 'object') {
        const medicalHistory = patient.medical_history as any;
        const assessment = medicalHistory.assessment;
        
        if (assessment) {
          if (assessment.next_assessment) {
            const nextAssessment = new Date(assessment.next_assessment);
            const daysUntil = Math.floor((nextAssessment.getTime() - now.getTime()) / (1000 * 3600 * 24));
            
            if (daysUntil < 0) {
              status.overdue++;
            } else if (daysUntil <= 30) {
              status.upcoming++;
            } else {
              status.completed++;
            }
          } else {
            status.completed++;
          }
        } else {
          status.overdue++;
        }
      } else {
        status.overdue++;
      }
    });
    
    return status;
  }, [patientsData]);

  // Top job roles (for visualization)
  const topJobRoles = React.useMemo(() => {
    return Object.entries(jobRoleDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({ role, count }));
  }, [jobRoleDistribution]);

  if (isLoadingPatients) {
    return (
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-4 ${className}`}>
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

  // Calculate completion percentage
  const totalEmployees = patientsData?.length || 0;
  const completionPercentage = totalEmployees > 0 
    ? Math.round((healthAssessmentStatus.completed / totalEmployees) * 100)
    : 0;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-purple-800 mb-4">
        Workforce Health Analytics
      </h3>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Job Role Distribution Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Top Job Roles</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {topJobRoles.length > 0 ? (
              <div className="space-y-2">
                {topJobRoles.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-sm truncate max-w-[70%]">
                      {item.role}
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {item.count} {item.count === 1 ? 'person' : 'people'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No job role data available</div>
            )}
          </CardContent>
        </Card>

        {/* Risk Category Breakdown Card */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Risk Categories</CardTitle>
            <AlertOctagon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm">High Risk</div>
                <div className="text-sm font-medium">{riskCategoryBreakdown['High Risk']}</div>
              </div>
              <Progress value={(riskCategoryBreakdown['High Risk'] / (totalEmployees || 1)) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-red-500" />
              
              <div className="flex items-center justify-between">
                <div className="text-sm">Medium Risk</div>
                <div className="text-sm font-medium">{riskCategoryBreakdown['Medium Risk']}</div>
              </div>
              <Progress value={(riskCategoryBreakdown['Medium Risk'] / (totalEmployees || 1)) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-amber-500" />
              
              <div className="flex items-center justify-between">
                <div className="text-sm">Low Risk</div>
                <div className="text-sm font-medium">{riskCategoryBreakdown['Low Risk']}</div>
              </div>
              <Progress value={(riskCategoryBreakdown['Low Risk'] / (totalEmployees || 1)) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Assessment Completion Status */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Assessment Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Completion rate</div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">{healthAssessmentStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-500">Due in 30 days</span>
                  <span className="font-medium">{healthAssessmentStatus.upcoming}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-500">Overdue</span>
                  <span className="font-medium">{healthAssessmentStatus.overdue}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Health Trend Card (Simulated) */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Health Index</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">87</span>
                <span className="text-sm text-green-500">+3%</span>
              </div>
              <div className="text-xs text-muted-foreground mb-4">Overall workforce health score</div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Physical Fitness</span>
                  <span>91%</span>
                </div>
                <Progress value={91} className="h-1.5 bg-gray-100" />
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <span>Mental Well-being</span>
                  <span>84%</span>
                </div>
                <Progress value={84} className="h-1.5 bg-gray-100" />
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <span>Occupational Safety</span>
                  <span>88%</span>
                </div>
                <Progress value={88} className="h-1.5 bg-gray-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
