
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import ClientRelationshipTable from '@/components/admin/ClientRelationshipTable';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';

export default function OrganizationClientsPage() {
  const { organizationId } = useParams<{ organizationId: string }>();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Clients
            </h1>
            <p className="text-muted-foreground">
              Manage client relationships and access
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        <ClientRelationshipTable organizationId={organizationId} />
      </div>
    </DashboardLayout>
  );
}
