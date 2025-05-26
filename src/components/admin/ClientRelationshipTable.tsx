
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MoreHorizontal, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface ClientRelationship {
  id: string;
  client_id: string;
  service_provider_id: string;
  is_active: boolean;
  relationship_start_date?: string;
  created_at: string;
  client_name?: string;
  client_email?: string;
}

interface ClientRelationshipTableProps {
  serviceProviderId?: string;
}

const ClientRelationshipTable: React.FC<ClientRelationshipTableProps> = ({ serviceProviderId }) => {
  const [relationships, setRelationships] = useState<ClientRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const providerId = serviceProviderId || currentOrganization?.id;

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      if (!providerId) return;

      const { data, error } = await supabase
        .from('organization_relationships')
        .select(`
          *,
          client:client_id (
            id,
            name,
            contact_email
          )
        `)
        .eq('service_provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten client info
      const transformedData = data?.map(rel => ({
        ...rel,
        client_name: rel.client?.name,
        client_email: rel.client?.contact_email
      })) || [];

      setRelationships(transformedData);
    } catch (error) {
      console.error('Error fetching client relationships:', error);
      toast.error('Failed to load client relationships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [providerId]);

  const toggleRelationshipStatus = async (relationshipId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('organization_relationships')
        .update({ is_active: !currentStatus })
        .eq('id', relationshipId);

      if (error) throw error;
      
      toast.success(`Relationship ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchRelationships(); // Refresh the list
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast.error('Failed to update relationship');
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this client relationship? This action cannot be undone.')) {
        return;
      }

      const { error } = await supabase
        .from('organization_relationships')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
      
      toast.success('Client relationship deleted');
      fetchRelationships(); // Refresh the list
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast.error('Failed to delete relationship');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Client Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Client Relationships ({relationships.length})
        </CardTitle>
        <CardDescription>
          Manage relationships with client organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {relationships.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Client Relationships</h3>
            <p className="text-muted-foreground">
              No client relationships have been established yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {relationships.map((relationship) => (
              <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">
                    {relationship.client_name || 'Unknown Client'}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {relationship.client_email && (
                      <span>{relationship.client_email}</span>
                    )}
                    {relationship.relationship_start_date && (
                      <span>Started: {new Date(relationship.relationship_start_date).toLocaleDateString()}</span>
                    )}
                    <span>Created: {new Date(relationship.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={relationship.is_active ? 'default' : 'secondary'}>
                    {relationship.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleRelationshipStatus(relationship.id, relationship.is_active)}
                      >
                        {relationship.is_active ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteRelationship(relationship.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientRelationshipTable;
