
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import OrganizationLogo from './OrganizationLogo';

interface OrganizationCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  actions?: React.ReactNode;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ 
  title, 
  children, 
  className = '',
  showLogo = true,
  actions
}) => {
  const { currentOrganization, currentClient } = useOrganization();
  
  // Determine which organization to display (client takes precedence if selected)
  const displayOrganization = currentClient || currentOrganization;
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b">
        <div className="space-y-1">
          <h3 className="font-medium">{title}</h3>
          {displayOrganization && (
            <p className="text-xs text-muted-foreground">
              {currentClient 
                ? `Client: ${displayOrganization.name}` 
                : displayOrganization.name
              }
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showLogo && <OrganizationLogo size="sm" />}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
