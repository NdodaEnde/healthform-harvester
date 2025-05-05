
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import OrganizationLogo from './OrganizationLogo';
import { Badge } from '@/components/ui/badge';

interface OrganizationCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  actions?: React.ReactNode;
  subtitle?: string;
  badges?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }[];
  organization?: {
    name?: string;
    logo_url?: string;
  } | null;
  client?: {
    name?: string;
    logo_url?: string;
  } | null;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ 
  title, 
  children, 
  className = '',
  showLogo = true,
  actions,
  subtitle,
  badges,
  organization = null,
  client = null
}) => {
  // Determine which organization to display (client takes precedence if selected)
  const displayOrganization = client || organization;
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{title}</h3>
            {badges && badges.length > 0 && (
              <div className="flex gap-1">
                {badges.map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant={badge.variant || "default"} 
                    className={badge.className}
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {displayOrganization?.name && (
            <p className="text-xs text-muted-foreground">
              {client 
                ? `Client: ${displayOrganization.name}` 
                : displayOrganization.name
              }
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showLogo && <OrganizationLogo size="sm" organization={displayOrganization} />}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;
