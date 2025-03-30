
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { BarChart2, FileBox, FileText, Home, Settings, Users, Building2, FolderCog } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardSidebar({ className }: SidebarNavProps) {
  const { pathname } = useLocation();
  const { currentOrganization } = useOrganization();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }
  
  const isServiceProvider = currentOrganization?.organization_type === 'service_provider';
  const isAdmin = currentOrganization?.userRole === 'admin' || currentOrganization?.userRole === 'superadmin';
  
  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="mr-2 h-4 w-4" />,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
    },
    {
      title: "Patients",
      href: "/patients",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      title: "Documents",
      href: "/documents",
      icon: <FileText className="mr-2 h-4 w-4" />,
    }
  ];
  
  // Admin section items
  const adminItems = isAdmin ? [
    {
      title: "Organizations",
      href: "/admin/organizations",
      icon: <Building2 className="mr-2 h-4 w-4" />,
      condition: isAdmin,
    },
    {
      title: "Settings",
      href: "/settings/organization",
      icon: <Settings className="mr-2 h-4 w-4" />,
      condition: isAdmin,
    }
  ] : [];
  
  // For service providers, add client management
  if (isServiceProvider && isAdmin) {
    adminItems.splice(1, 0, {
      title: "Client Management",
      href: `/admin/organizations/${currentOrganization?.id}/clients`,
      icon: <FolderCog className="mr-2 h-4 w-4" />,
      condition: isServiceProvider && isAdmin,
    });
  }

  return (
    <ScrollArea className={cn("h-full py-4", className)}>
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Main
        </h2>
        <div className="space-y-1">
          {items.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className={cn("w-full justify-start", 
                pathname === item.href ? "bg-muted" : "hover:bg-muted"
              )}
              asChild
            >
              <Link to={item.href}>
                {item.icon}
                {item.title}
              </Link>
            </Button>
          ))}
        </div>
        
        {adminItems.length > 0 && (
          <>
            <h2 className="mt-6 mb-2 px-4 text-lg font-semibold tracking-tight">
              Administration
            </h2>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href || pathname.startsWith(item.href + '/') ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("w-full justify-start",
                    (pathname === item.href || pathname.startsWith(item.href + '/')) ? "bg-muted" : "hover:bg-muted"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    {item.icon}
                    {item.title}
                  </Link>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
