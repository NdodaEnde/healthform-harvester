
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBasicAnalytics } from '@/hooks/useBasicAnalytics';
import { 
  Stethoscope, Heart, FileText, UserCheck, Clock, AlertTriangle, 
  ClipboardList, Calendar, Users, CheckCircle, Eye, Ear, Wind 
} from 'lucide-react';

const ClinicalWorkflowDashboard = () => {
  const { data: analytics, isLoading, error } = useBasicAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load clinical workflow data.</p>
        </CardContent>
      </Card>
    );
  }

  const clinicalWorkflows = [
    {
      title: "Pre-Employment Medicals",
      count: Math.round(analytics.totalExaminations * 0.3),
      icon: UserCheck,
      description: "Medical assessments for new hires",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      priority: "high"
    },
    {
      title: "Periodic Health Assessments",
      count: Math.round(analytics.totalExaminations * 0.4),
      icon: Calendar,
      description: "Regular health monitoring",
      color: "text-green-600",
      bgColor: "bg-green-50",
      priority: "medium"
    },
    {
      title: "Fitness for Duty Evaluations",
      count: analytics.totalFit,
      icon: Heart,
      description: "Current workforce fitness status",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      priority: "high"
    },
    {
      title: "Medical Surveillance",
      count: Math.round(analytics.totalExaminations * 0.15),
      icon: Stethoscope,
      description: "Ongoing health monitoring programs",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      priority: "medium"
    },
    {
      title: "Return to Work Assessments",
      count: Math.round(analytics.totalExaminations * 0.1),
      icon: CheckCircle,
      description: "Post-incident medical clearances",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      priority: "high"
    },
    {
      title: "Exit Medical Examinations",
      count: Math.round(analytics.totalExaminations * 0.05),
      icon: FileText,
      description: "End of employment health assessments",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      priority: "low"
    }
  ];

  const clinicalActions = [
    {
      title: "Schedule Medical Examinations",
      description: "Book appointments for pending health assessments",
      icon: Calendar,
      count: analytics.pendingDocuments,
      action: "Schedule Now"
    },
    {
      title: "Review Medical Reports",
      description: "Clinical review of completed examinations",
      icon: ClipboardList,
      count: Math.round(analytics.totalExaminations * 0.2),
      action: "Review Reports"
    },
    {
      title: "Process Fitness Declarations",
      description: "Issue fitness certificates and restrictions",
      icon: Heart,
      count: analytics.certificatesExpiring,
      action: "Process Now"
    },
    {
      title: "Medical Record Management",
      description: "Update and maintain patient health records",
      icon: FileText,
      count: analytics.totalPatients,
      action: "Manage Records"
    }
  ];

  const urgentTasks = [
    ...(analytics.certificatesExpiring > 0 ? [{
      title: "Certificate Renewals",
      description: `${analytics.certificatesExpiring} certificates expiring within 30 days`,
      priority: "urgent",
      icon: AlertTriangle
    }] : []),
    ...(analytics.pendingDocuments > 0 ? [{
      title: "Pending Medical Reviews",
      description: `${analytics.pendingDocuments} medical assessments awaiting review`,
      priority: "high",
      icon: Clock
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clinical Workflow Dashboard</h2>
          <p className="text-muted-foreground">Occupational health operations and clinical management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Clinical Operations
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            Medical Workflows
          </Badge>
        </div>
      </div>

      {/* Urgent Tasks Alert */}
      {urgentTasks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Clinical Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentTasks.map((task, index) => {
                const IconComponent = task.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-orange-900">{task.title}</div>
                        <div className="text-sm text-orange-700">{task.description}</div>
                      </div>
                    </div>
                    <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Workflow Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clinicalWorkflows.map((workflow) => {
          const IconComponent = workflow.icon;
          return (
            <Card key={workflow.title} className="hover:shadow-md transition-shadow">
              <CardHeader className={`${workflow.bgColor} pb-2`}>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${workflow.color}`} />
                  {workflow.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{workflow.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflow.description}
                </p>
                <div className="mt-2">
                  <Badge variant={
                    workflow.priority === 'high' ? 'default' : 
                    workflow.priority === 'medium' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {workflow.priority} priority
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Clinical Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Clinical Actions Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <div key={action.title} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">{action.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{action.count} items</Badge>
                        <Button size="sm" variant="outline">
                          {action.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Medical Testing Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standard Medical Testing Protocols</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Vision Testing</span>
              </div>
              <div className="text-sm text-blue-800">
                Standard vision acuity and color vision assessments for workplace safety
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Ear className="h-5 w-5 text-green-600" />
                <span className="font-medium">Hearing Assessment</span>
              </div>
              <div className="text-sm text-green-800">
                Audiometric testing for noise-exposed workers and baseline monitoring
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Respiratory Health</span>
              </div>
              <div className="text-sm text-purple-800">
                Lung function testing and respiratory health monitoring programs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clinical Workflow Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Appointments
            </Button>
            <Button variant="outline" size="sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              Review Medical Forms
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Process Fitness Declarations
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Patient Management
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalWorkflowDashboard;
