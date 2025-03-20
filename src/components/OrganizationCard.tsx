
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import OrganizationLogo from './OrganizationLogo';

interface OrganizationCardProps {
  title: string;
  children: React.ReactNode;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ title, children }) => {
  const { currentOrganization } = useOrganization();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h3 className="font-medium">{title}</h3>
        <OrganizationLogo size="sm" />
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
