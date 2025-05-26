
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import type { DatabaseOrganization } from '@/types/database';

interface OrganizationHeaderProps {
  organization: DatabaseOrganization;
}

const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({ organization }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {organization.name}
        </CardTitle>
        <CardDescription>
          Organization: {organization.id}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default OrganizationHeader;
