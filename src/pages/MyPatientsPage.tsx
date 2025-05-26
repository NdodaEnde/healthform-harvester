
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MyPatientsList from '@/components/my/MyPatientsList';
import MyPatientForm from '@/components/my/MyPatientForm';
import MyOrganizationsList from '@/components/my/MyOrganizationsList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MyPatientWithOrganization, MyOrganizationWithType } from '@/types/normalized-database';

const MyPatientsPage: React.FC = () => {
  const [selectedOrganization, setSelectedOrganization] = useState<MyOrganizationWithType | undefined>();
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<MyPatientWithOrganization | undefined>();

  const handleOrganizationSelect = (organization: MyOrganizationWithType) => {
    // Only allow selection of client organizations
    if (organization.organization_type?.type_name === 'client') {
      setSelectedOrganization(organization);
    }
  };

  const handleAddNewPatient = () => {
    setEditingPatient(undefined);
    setShowPatientForm(true);
  };

  const handleEditPatient = (patient: MyPatientWithOrganization) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  const handlePatientSave = () => {
    setShowPatientForm(false);
    setEditingPatient(undefined);
    // Refresh the list (handled by the form component)
  };

  const handlePatientCancel = () => {
    setShowPatientForm(false);
    setEditingPatient(undefined);
  };

  const handleBackToOrganizations = () => {
    setSelectedOrganization(undefined);
    setShowPatientForm(false);
    setEditingPatient(undefined);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {(selectedOrganization || showPatientForm) && (
            <Button variant="ghost" onClick={handleBackToOrganizations}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {showPatientForm ? 'Back to Patients' : 'Back to Organizations'}
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {showPatientForm 
              ? (editingPatient ? 'Edit Patient' : 'Add New Patient')
              : selectedOrganization 
                ? `Patients - ${selectedOrganization.name}`
                : 'Patients Management'
            }
          </h1>
        </div>

        {showPatientForm ? (
          <MyPatientForm
            patient={editingPatient}
            preselectedOrganizationId={selectedOrganization?.id}
            onSave={handlePatientSave}
            onCancel={handlePatientCancel}
          />
        ) : selectedOrganization ? (
          <MyPatientsList
            clientOrganizationId={selectedOrganization.id}
            onEditPatient={handleEditPatient}
            allowEdit={true}
          />
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Client Organization</CardTitle>
                <CardDescription>
                  Choose a client organization to view and manage their patients. 
                  Only client organizations can have patients.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MyOrganizationsList
                  onSelectOrganization={handleOrganizationSelect}
                  allowSelection={true}
                  allowEdit={false}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyPatientsPage;
