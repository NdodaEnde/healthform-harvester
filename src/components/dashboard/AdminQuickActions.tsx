
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Building, Settings, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";

export function AdminQuickActions() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 items-center justify-center"
            onClick={() => navigate(`/admin/organizations/${currentOrganization?.id}/users`)}
          >
            <UserPlus className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Add User</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 items-center justify-center"
            onClick={() => navigate('/admin/organizations/new')}
          >
            <Building className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">New Organization</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 items-center justify-center"
            onClick={() => navigate('/settings/organization')}
          >
            <Settings className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">System Settings</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 items-center justify-center"
            onClick={() => navigate('/documents?status=pending')}
          >
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Pending Documents</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 items-center justify-center"
            onClick={() => console.log("Generate report")}
          >
            <Download className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Generate Report</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
