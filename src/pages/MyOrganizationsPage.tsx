
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MyOrganizationsList from '@/components/my/MyOrganizationsList';
import MyOrganizationForm from '@/components/my/MyOrganizationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { MyOrganizationWithType } from '@/types/normalized-database';

const MyOrganizationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<MyOrganizationWithType | undefined>();

  const handleAddNew = () => {
    setEditingOrganization(undefined);
    setShowForm(true);
  };

  const handleEdit = (organization: MyOrganizationWithType) => {
    setEditingOrganization(organization);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingOrganization(undefined);
    // Refresh the list (handled by the form component)
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingOrganization(undefined);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {showForm && (
            <Button variant="ghost" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {showForm 
              ? (editingOrganization ? 'Edit Organization' : 'Add New Organization')
              : 'Organizations Management'
            }
          </h1>
        </div>

        {showForm ? (
          <MyOrganizationForm
            organization={editingOrganization}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <MyOrganizationsList
            onEditOrganization={handleEdit}
            allowEdit={true}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyOrganizationsPage;
