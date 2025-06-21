import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MoreHorizontal, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  serviceProviderId: string;
}

const ClientRelationshipTable: React.FC<ClientRelationshipTableProps> = ({ serviceProviderId }) => {
  const [relationships, setRelationships] = useState<ClientRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      
      if (!serviceProviderId) {
        console.log('No service provider ID provided');
        setRelationships([]);
        return;
      }

      console.log('Fetching relationships for provider:', serviceProviderId);

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
        .eq('service_provider_id', serviceProviderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw relationships data:', data);

      // Transform the data to flatten client info
      const transformedData = (data || []).map((rel: any) => ({
        ...rel,
        client_name: rel.client?.name || 'Unknown Client',
        client_email: rel.client?.contact_email || ''
      }));

      console.log('Transformed relationships:', transformedData);
      setRelationships(transformedData);
    } catch (error) {
      console.error('Error fetching client relationships:', error);
      toast.error('Failed to load client relationships');
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceProviderId) {
      fetchRelationships();
    }
  }, [serviceProviderId]);

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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading client relationships...</p>
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Client Relationships</h3>
        <p className="text-muted-foreground">
          No client relationships have been established yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          Client Relationships ({relationships.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage relationships with client organizations
        </p>
      </div>
      
      <div className="space-y-4">
        {relationships.map((relationship) => (
          <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">
                {relationship.client_name}
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
    </div>
  );
};

export default ClientRelationshipTable;