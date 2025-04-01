
import React from 'react';
import { useUserRole } from '@/utils/roleUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TotalDocumentsCard } from '@/components/dashboard/TotalDocumentsCard';
import { DocumentActivityChart } from '@/components/dashboard/DocumentActivityChart';
import { DocumentStatusChart } from '@/components/dashboard/DocumentStatusChart';
import { LayoutDashboard, Loader2, AlertTriangle, UserRound, CalendarClock, BookMedical, FileText, ClipboardList, Users } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  onClick?: () => void;
}

const DashboardStat: React.FC<DashboardStatProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  onClick 
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend.positive ? 'text-green-500' : 'text-amber-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value} {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const RoleBasedDashboard: React.FC = () => {
  const { role, loading } = useUserRole();
  const { getEffectiveOrganizationId } = useOrganization();
  const organizationId = getEffectiveOrganizationId();
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }
  
  if (!role) {
    return (
      <div className="text-center py-10 border rounded-lg bg-background">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Role not determined</h3>
        <p className="text-muted-foreground mb-4">Unable to determine your user role</p>
      </div>
    );
  }

  // Admin Dashboard
  if (role === 'admin') {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <TotalDocumentsCard organizationId={organizationId} />
          
          <DashboardStat
            title="Pending Certifications"
            value="12"
            icon={<FileText />}
            description="Certificates awaiting review"
            trend={{ value: 3, label: "since yesterday", positive: false }}
            onClick={() => navigate('/documents?status=pending')}
          />
          
          <DashboardStat
            title="Active Patients"
            value="245"
            icon={<UserRound />}
            description="Total patients in system"
            trend={{ value: 18, label: "this month", positive: true }}
            onClick={() => navigate('/patients')}
          />
          
          <DashboardStat
            title="Organization Users"
            value="24"
            icon={<Users />}
            description="Staff and clinicians"
            onClick={() => navigate(`/admin/organizations/${organizationId}/users`)}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-12">
          <DocumentActivityChart organizationId={organizationId} />
          <DocumentStatusChart organizationId={organizationId} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                All systems operational
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Document Processing</span>
                <span className="text-green-500 text-sm">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Patient Records</span>
                <span className="text-green-500 text-sm">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Certificate Generation</span>
                <span className="text-green-500 text-sm">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <span className="text-green-500 text-sm">Online</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Certificate template updated</p>
                  <p className="text-xs text-muted-foreground">2 hours ago by admin@example.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">New user added to organization</p>
                  <p className="text-xs text-muted-foreground">5 hours ago by admin@example.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">12 new documents processed</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Clinician Dashboard
  if (role === 'clinician') {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            title="Today's Appointments"
            value="8"
            icon={<CalendarClock />}
            description="3 completed, 5 upcoming"
            onClick={() => navigate('/appointments')}
          />
          
          <DashboardStat
            title="Pending Reviews"
            value="7"
            icon={<FileText />}
            description="Medical documents awaiting review"
            onClick={() => navigate('/documents?status=pending')}
          />
          
          <DashboardStat
            title="Active Patients"
            value="32"
            icon={<UserRound />}
            description="Under your care"
            onClick={() => navigate('/patients')}
          />
          
          <DashboardStat
            title="Medical Records"
            value="156"
            icon={<BookMedical />}
            description="Updated in last 30 days"
            onClick={() => navigate('/medical-records')}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-12">
          <Card className="col-span-12 md:col-span-8">
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your schedule for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-muted-foreground">Annual Certificate of Fitness</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">10:30 AM</p>
                    <p className="text-sm text-muted-foreground">30 minutes</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">Sara Johnson</p>
                    <p className="text-sm text-muted-foreground">Pre-employment Screening</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">11:15 AM</p>
                    <p className="text-sm text-muted-foreground">45 minutes</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">David Williams</p>
                    <p className="text-sm text-muted-foreground">Injury Assessment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">1:00 PM</p>
                    <p className="text-sm text-muted-foreground">60 minutes</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/appointments')}>
                View All Appointments
              </Button>
            </CardContent>
          </Card>
          
          <Card className="col-span-12 md:col-span-4">
            <CardHeader>
              <CardTitle>Documents for Review</CardTitle>
              <CardDescription>
                Pending your assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1">
                    <FileText className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Medical Questionnaire</p>
                    <p className="text-xs text-muted-foreground">Patient: Alex Brown</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1">
                    <FileText className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fitness Assessment</p>
                    <p className="text-xs text-muted-foreground">Patient: Maria Garcia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1">
                    <FileText className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Return to Work Form</p>
                    <p className="text-xs text-muted-foreground">Patient: James Wilson</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/documents?status=pending')}>
                Review All Documents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Staff Dashboard  
  if (role === 'staff') {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            title="Today's Appointments"
            value="15"
            icon={<CalendarClock />}
            description="Scheduled for today"
            onClick={() => navigate('/appointments')}
          />
          
          <DashboardStat
            title="Document Queue"
            value="18"
            icon={<FileText />}
            description="Awaiting processing"
            onClick={() => navigate('/documents?status=pending')}
          />
          
          <DashboardStat
            title="Tasks"
            value="9"
            icon={<ClipboardList />}
            description="Assigned to you"
            trend={{ value: 3, label: "completed today", positive: true }}
            onClick={() => navigate('/tasks')}
          />
          
          <TotalDocumentsCard organizationId={organizationId} />
        </div>
        
        <div className="grid gap-4 grid-cols-12">
          <Card className="col-span-12 md:col-span-7">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                Appointments for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">Michael Thompson</p>
                    <p className="text-sm text-muted-foreground">Dr. Anderson - Pre-employment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">9:00 AM</p>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                      Checked In
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">Emily Clark</p>
                    <p className="text-sm text-muted-foreground">Dr. Martinez - Annual Medical</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">10:15 AM</p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      Upcoming
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="font-medium">Robert Johnson</p>
                    <p className="text-sm text-muted-foreground">Dr. Williams - Follow-up</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">11:30 AM</p>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      Upcoming
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/appointments')}>
                View Full Schedule
              </Button>
            </CardContent>
          </Card>
          
          <Card className="col-span-12 md:col-span-5">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>
                Your assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Follow up with patient</p>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        Urgent
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Call regarding test results</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Process health records</p>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                        Medium
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Update medical history for 3 patients</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Schedule follow-up appointments</p>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        Low
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">For patients seen last week</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/tasks')}>
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Client Dashboard
  if (role === 'client') {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <TotalDocumentsCard organizationId={organizationId} />
          
          <DashboardStat
            title="Employees"
            value="48"
            icon={<Users />}
            description="Active employees"
            onClick={() => navigate('/employees')}
          />
          
          <DashboardStat
            title="Expiring Certificates"
            value="7"
            icon={<FileText />}
            description="Expiring in next 30 days"
            trend={{ value: 2, label: "more than last month", positive: false }}
            onClick={() => navigate('/documents?status=expiring')}
          />
          
          <DashboardStat
            title="Compliance Rate"
            value="92%"
            icon={<ClipboardList />}
            description="Overall certification compliance"
            trend={{ value: 5, label: "% increase", positive: true }}
            onClick={() => navigate('/reports/compliance')}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-12">
          <DocumentActivityChart organizationId={organizationId} />
          <DocumentStatusChart organizationId={organizationId} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Certification Status</CardTitle>
              <CardDescription>
                Employee certification overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Valid Certificates</span>
                  <span className="font-medium">41 (85%)</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expiring Soon</span>
                  <span className="font-medium">7 (15%)</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Expired</span>
                  <span className="font-medium">0 (0%)</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/reports/compliance')}>
                View Full Report
              </Button>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Certifications</CardTitle>
              <CardDescription>
                Latest employee certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <FileText className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Certificate of Fitness</p>
                    <p className="text-xs text-muted-foreground">Employee: Thomas Roberts</p>
                    <p className="text-xs text-green-600">Valid until: Jan 15, 2024</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-1">
                    <FileText className="h-4 w-4 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Safety Training Certificate</p>
                    <p className="text-xs text-muted-foreground">Employee: Susan Miller</p>
                    <p className="text-xs text-green-600">Valid until: Feb 22, 2024</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-1">
                    <FileText className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Health Assessment</p>
                    <p className="text-xs text-muted-foreground">Employee: James Wong</p>
                    <p className="text-xs text-amber-600">Expires in 28 days</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/documents')}>
                View All Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Default dashboard if role doesn't match any specific type
  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <TotalDocumentsCard organizationId={organizationId} />
        
        <DashboardStat
          title="Patients"
          value="--"
          icon={<UserRound />}
          description="Registered patients"
          onClick={() => navigate('/patients')}
        />
        
        <DashboardStat
          title="Documents"
          value="--"
          icon={<FileText />}
          description="All documents"
          onClick={() => navigate('/documents')}
        />
      </div>
      
      <div className="grid gap-4 grid-cols-12">
        <DocumentActivityChart organizationId={organizationId} />
        <DocumentStatusChart organizationId={organizationId} />
      </div>
    </div>
  );
};

// Import at the top
import { Badge } from "@/components/ui/badge";
