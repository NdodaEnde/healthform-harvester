import React from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InvitationList from '@/components/InvitationList';
import UserList from '@/components/UserList';

const OrganizationUsersPage = () => {
  const { organizationId } = useParams<{ organizationId: string }>();

  if (!organizationId) {
    return <div>Organization ID is required.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage organization users and invitations
        </p>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UserList organizationId={organizationId} />
        </TabsContent>
        
        <TabsContent value="invitations" className="space-y-6">
          <InvitationList organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationUsersPage;
