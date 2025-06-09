import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users as UsersIcon, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvitationList from '@/components/InvitationList';
import UserList from '@/components/UserList';
import { useOrganization } from '@/contexts/OrganizationContext';

const OrganizationUsersPage = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { currentOrganization } = useOrganization();

  // Use organizationId from URL params if available, otherwise use current organization
  const effectiveOrganizationId = organizationId || currentOrganization?.id;

  if (!effectiveOrganizationId) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization selected. Please select an organization first or ensure you have proper access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get organization name for display
  const organizationName = organizationId 
    ? "Organization" // We'd need to fetch this if using URL param
    : currentOrganization?.name || "Current Organization";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users and invitations for <span className="font-medium">{organizationName}</span>
        </p>
      </div>
      
      <Tabs defaultValue="invitations" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Send Invitations
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Current Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                User Invitations
              </CardTitle>
              <CardDescription>
                Send invitations and manage pending invites for {organizationName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationList organizationId={effectiveOrganizationId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Organization Users
              </CardTitle>
              <CardDescription>
                Users who currently have access to {organizationName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserList organizationId={effectiveOrganizationId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationUsersPage;