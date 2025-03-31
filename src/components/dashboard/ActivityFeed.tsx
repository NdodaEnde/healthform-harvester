
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, UserRound, CheckCircle, Building } from "lucide-react";

interface ActivityItem {
  id: number;
  action: string;
  target: string;
  timestamp: string;
  icon: React.ReactNode;
}

interface ActivityFeedProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  limit = 5, 
  showViewAll = true,
  className 
}) => {
  const navigate = useNavigate();
  
  // Mock activity data - would come from an API in a real app
  const activities: ActivityItem[] = [
    {
      id: 1,
      action: "Certificate uploaded",
      target: "John Smith",
      timestamp: "10 minutes ago",
      icon: <FileText size={16} className="text-blue-500" />
    },
    {
      id: 2,
      action: "Patient added",
      target: "Sarah Johnson",
      timestamp: "2 hours ago",
      icon: <UserRound size={16} className="text-green-500" />
    },
    {
      id: 3,
      action: "Certificate reviewed",
      target: "Michael Brown",
      timestamp: "Yesterday",
      icon: <CheckCircle size={16} className="text-green-600" />
    },
    {
      id: 4,
      action: "Organization updated",
      target: "Healthcare Corp",
      timestamp: "2 days ago",
      icon: <Building size={16} className="text-purple-500" />
    },
    {
      id: 5,
      action: "User invited",
      target: "doctor@example.com",
      timestamp: "3 days ago",
      icon: <UserRound size={16} className="text-amber-500" />
    },
    {
      id: 6,
      action: "Certificate expired",
      target: "Robert Taylor",
      timestamp: "1 week ago",
      icon: <FileText size={16} className="text-red-500" />
    }
  ];

  // Limit the number of activities shown
  const displayedActivities = activities.slice(0, limit);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map(activity => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="mt-0.5">{activity.icon}</div>
              <div>
                <div className="font-medium">{activity.action}</div>
                <div className="text-sm text-muted-foreground">{activity.target}</div>
                <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {showViewAll && (
        <CardFooter>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/activity')}>
            View all activity
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ActivityFeed;
