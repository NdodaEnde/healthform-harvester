
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import UserManagementList from '@/components/admin/UserManagementList';
import { Button } from '@/components/ui/button';
import { Plus, UserCheck } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function OrganizationUsersPage() {
  const { organizationId } = useParams<{ organizationId: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UserCheck className="h-8 w-8" />
              Users
            </h1>
            <p className="text-muted-foreground">
              Manage organization users and permissions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>

        <UserManagementList users={[]} organizationId={organizationId || ""} />
      </div>
    </DashboardLayout>
  );
}
