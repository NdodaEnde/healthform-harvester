
import React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import OrganizationList from '@/components/admin/OrganizationList';
import { Button } from '@/components/ui/button';
import { Plus, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrganizationsPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building className="h-8 w-8" />
              Organizations
            </h1>
            <p className="text-muted-foreground">
              Manage organizations and their settings
            </p>
          </div>
          <Button onClick={() => navigate('/admin/organizations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>

        <OrganizationList organizations={[]} />
      </div>
    </DashboardLayout>
  );
}
