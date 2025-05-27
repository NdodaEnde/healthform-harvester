
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import MyOrganizationsList from '@/components/my/MyOrganizationsList';
import MyOrganizationForm from '@/components/my/MyOrganizationForm';
import AuthChecker from '@/components/AuthChecker';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import type { MyOrganizationWithType } from '@/types/normalized-database';

const MyOrganizationsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<MyOrganizationWithType | undefined>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    checkUserAccess();
  }, [currentOrganization]);

  const checkUserAccess = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setHasAccess(false);
        return;
      }

      console.log('Checking access for user:', user.id);

      // Check if user has any organization access
      const { data: userOrgs, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, role')
        .eq('user_id', user.id);

      if (orgError) {
        console.error('Error checking user organizations:', orgError);
        toast.error('Failed to verify user access');
        setHasAccess(false);
        return;
      }

      if (!userOrgs || userOrgs.length === 0) {
        console.log('User has no organization access');
        setHasAccess(false);
        return;
      }

      console.log('User organizations:', userOrgs);
      
      // User has access if they belong to at least one organization
      setHasAccess(true);
      
    } catch (error) {
      console.error('Error checking user access:', error);
      toast.error('Failed to verify access permissions');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Checking access permissions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasAccess === false) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have permission to access this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This page requires organization membership. Please contact your administrator if you believe this is an error.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="w-full"
                >
                  Go Back
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDebug(true)}
                  className="w-full"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Debug Authentication
                </Button>
              </div>
              
              {showDebug && (
                <div className="mt-4">
                  <AuthChecker />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
          >
            <Bug className="h-4 w-4" />
          </Button>
        </div>

        {showDebug && (
          <div className="mb-6">
            <AuthChecker />
          </div>
        )}

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
