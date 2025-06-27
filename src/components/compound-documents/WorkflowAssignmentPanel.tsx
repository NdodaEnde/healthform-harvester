
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Stethoscope,
  Shield,
  UserCheck
} from 'lucide-react';
import { CompoundDocument, WorkflowStatus } from '@/types/compound-document';
import { useOrganization } from '@/contexts/OrganizationContext';

interface WorkflowAssignmentPanelProps {
  document: CompoundDocument;
  onWorkflowUpdate?: () => void;
}

interface WorkflowStep {
  status: WorkflowStatus;
  title: string;
  description: string;
  icon: React.ReactNode;
  role: string;
  assignedTo?: string;
  completedAt?: string;
  completedBy?: string;
  isActive: boolean;
  canAssign: boolean;
}

const WorkflowAssignmentPanel: React.FC<WorkflowAssignmentPanelProps> = ({ 
  document, 
  onWorkflowUpdate 
}) => {
  const { currentOrganization } = useOrganization();
  const [assigningStep, setAssigningStep] = useState<WorkflowStatus | null>(null);

  const getWorkflowSteps = (): WorkflowStep[] => {
    const currentStatus = document.workflow_status;
    
    const steps: WorkflowStep[] = [
      {
        status: 'receptionist_review',
        title: 'Initial Review',
        description: 'Document intake and basic validation',
        icon: <User className="h-4 w-4" />,
        role: 'Receptionist',
        isActive: currentStatus === 'receptionist_review',
        canAssign: currentStatus === 'receptionist_review'
      },
      {
        status: 'nurse_review',
        title: 'Clinical Review',
        description: 'Medical data extraction and validation',
        icon: <UserCheck className="h-4 w-4" />,
        role: 'Nurse',
        isActive: currentStatus === 'nurse_review',
        canAssign: currentStatus === 'nurse_review' || currentStatus === 'receptionist_review'
      },
      {
        status: 'tech_review',
        title: 'Technical Processing',
        description: 'Advanced analysis and quality checks',
        icon: <Shield className="h-4 w-4" />,
        role: 'Technician',
        isActive: currentStatus === 'tech_review',
        canAssign: ['tech_review', 'nurse_review', 'receptionist_review'].includes(currentStatus)
      },
      {
        status: 'doctor_approval',
        title: 'Medical Approval',
        description: 'Final medical review and approval',
        icon: <Stethoscope className="h-4 w-4" />,
        role: 'Doctor',
        isActive: currentStatus === 'doctor_approval',
        canAssign: ['doctor_approval', 'tech_review', 'nurse_review', 'receptionist_review'].includes(currentStatus)
      },
      {
        status: 'completed',
        title: 'Completed',
        description: 'Document fully processed and approved',
        icon: <CheckCircle className="h-4 w-4" />,
        role: 'System',
        isActive: currentStatus === 'completed',
        canAssign: false
      }
    ];

    // Add assignment information from document metadata
    steps.forEach(step => {
      const assignment = document.workflow_assignments[step.status];
      if (assignment) {
        step.assignedTo = assignment.assigned_to;
        step.completedAt = assignment.completed_at;
        step.completedBy = assignment.completed_by;
      }
    });

    return steps;
  };

  const getStepStatus = (step: WorkflowStep, currentStatus: WorkflowStatus) => {
    const statusOrder: WorkflowStatus[] = [
      'receptionist_review',
      'nurse_review', 
      'tech_review',
      'doctor_approval',
      'completed'
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step.status);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleAssignStep = (stepStatus: WorkflowStatus) => {
    setAssigningStep(stepStatus);
    // This would typically open a user selection dialog
    console.log('Assigning step:', stepStatus);
    
    // Simulate assignment
    setTimeout(() => {
      setAssigningStep(null);
      onWorkflowUpdate?.();
    }, 1000);
  };

  const handleAdvanceWorkflow = () => {
    // This would typically call an API to advance the workflow
    console.log('Advancing workflow from:', document.workflow_status);
    onWorkflowUpdate?.();
  };

  const steps = getWorkflowSteps();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Workflow Management
          <Badge variant="outline" className="ml-auto">
            {document.workflow_status.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Progress */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step, document.workflow_status);
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.status} className="relative">
                <div className="flex items-center gap-4">
                  {/* Step Icon */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${status === 'completed' ? 'bg-green-100 border-green-500' : 
                      status === 'active' ? 'bg-blue-100 border-blue-500' : 
                      'bg-gray-100 border-gray-300'}
                  `}>
                    {step.icon}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{step.title}</h3>
                      <Badge className={getStatusColor(status)}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Role: {step.role}</span>
                      {step.assignedTo && (
                        <span>Assigned to: {step.assignedTo}</span>
                      )}
                      {step.completedAt && (
                        <span>Completed: {new Date(step.completedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {step.canAssign && status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignStep(step.status)}
                        disabled={assigningStep === step.status}
                      >
                        {assigningStep === step.status ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          'Assign'
                        )}
                      </Button>
                    )}
                    
                    {step.isActive && step.assignedTo && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAdvanceWorkflow}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className={`
                    absolute left-5 top-10 w-0.5 h-8
                    ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            );
          })}
        </div>

        {/* Assignment Summary */}
        {Object.keys(document.workflow_assignments).length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Assignment History</h3>
            <div className="space-y-2">
              {Object.entries(document.workflow_assignments).map(([status, assignment]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {status.replace('_', ' ').toUpperCase()}:
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {(assignment.assigned_to || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{assignment.assigned_to}</span>
                    {assignment.completed_at && (
                      <Badge variant="outline" className="ml-2">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowAssignmentPanel;
