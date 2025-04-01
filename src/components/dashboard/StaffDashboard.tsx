
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarClock, FileText, ClipboardList, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TotalDocumentsCard } from './TotalDocumentsCard';
import { WorkQueueCard } from './WorkQueueCard';

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

export function StaffDashboard({ organizationId }: { organizationId: string | null }) {
  const navigate = useNavigate();

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
        <WorkQueueCard organizationId={organizationId} />
        
        <Card className="col-span-12 md:col-span-6">
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
      </div>
    </div>
  );
}
