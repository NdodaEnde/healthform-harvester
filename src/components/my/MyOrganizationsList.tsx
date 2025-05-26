
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { NormalizedDataService } from '@/services/normalizedDataService';
import type { MyOrganizationWithType } from '@/types/normalized-database';

interface MyOrganizationsListProps {
  onSelectOrganization?: (organization: MyOrganizationWithType) => void;
  onEditOrganization?: (organization: MyOrganizationWithType) => void;
  allowSelection?: boolean;
  allowEdit?: boolean;
}

const MyOrganizationsList: React.FC<MyOrganizationsListProps> = ({
  onSelectOrganization,
  onEditOrganization,
  allowSelection = false,
  allowEdit = true
}) => {
  const [organizations, setOrganizations] = useState<MyOrganizationWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await NormalizedDataService.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      (org.contact_email && org.contact_email.toLowerCase().includes(searchLower)) ||
      (org.organization_type?.type_name && org.organization_type.type_name.toLowerCase().includes(searchLower))
    );
  });

  const handleOrganizationClick = (organization: MyOrganizationWithType) => {
    if (allowSelection && onSelectOrganization) {
      onSelectOrganization(organization);
    }
  };

  const handleEditClick = (e: React.MouseEvent, organization: MyOrganizationWithType) => {
    e.stopPropagation();
    if (onEditOrganization) {
      onEditOrganization(organization);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organizations
              </CardTitle>
              <CardDescription>
                Manage organization records and relationships
              </CardDescription>
            </div>
            <Button onClick={() => {}}>
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name, email, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredOrganizations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Organizations Found' : 'No Organizations'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'No organizations match your search criteria.'
                  : 'No organizations have been added yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrganizations.map((organization) => (
                <div 
                  key={organization.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    allowSelection ? 'hover:bg-accent cursor-pointer' : ''
                  }`}
                  onClick={() => handleOrganizationClick(organization)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {organization.name}
                      </h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <Badge variant={organization.organization_type?.type_name === 'service_provider' ? 'default' : 'secondary'}>
                          {organization.organization_type?.type_name || 'Unknown Type'}
                        </Badge>
                        {organization.contact_email && (
                          <span>{organization.contact_email}</span>
                        )}
                        {organization.contact_phone && (
                          <span>{organization.contact_phone}</span>
                        )}
                        <span className={organization.is_active ? 'text-green-600' : 'text-red-600'}>
                          {organization.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {allowEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleEditClick(e, organization)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyOrganizationsList;
