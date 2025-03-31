
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserRound,
  ScrollText,
  Activity,
  Calendar,
  Bell,
  Upload,
  HelpCircle,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrganization, isServiceProvider } = useOrganization();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Define user role - in a real app, this would come from auth context
  // For now, we'll simulate based on isServiceProvider
  const userRole = isServiceProvider() ? 'admin' : 'staff';
  
  // Common navigation items for all roles
  const commonNavItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Documents", 
      href: "/dashboard", 
      icon: FileText 
    },
    {
      name: "Patients",
      href: "/patients",
      icon: UserRound
    }
  ];
  
  // Admin-specific navigation items
  const adminNavItems = [
    {
      name: "Certificate Templates",
      href: "/certificates/templates",
      icon: ScrollText
    },
    { 
      name: "Organizations", 
      href: "/admin/organizations", 
      icon: Building
    },
    { 
      name: "Users", 
      href: `/admin/organizations/${currentOrganization?.id}/users`, 
      icon: Users 
    }
  ];
  
  // Staff-specific navigation items
  const staffNavItems = [
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar
    },
    {
      name: "Activity",
      href: "/activity",
      icon: Activity
    }
  ];
  
  // Settings navigation item for all roles
  const settingsNavItem = { 
    name: "Settings", 
    href: "/settings/organization", 
    icon: Settings 
  };
  
  // Combine navigation items based on role
  const navItems = [
    ...commonNavItems,
    ...(userRole === 'admin' ? adminNavItems : []),
    ...(userRole === 'staff' ? staffNavItems : []),
    settingsNavItem
  ];

  // If service provider, add client management
  if (isServiceProvider()) {
    navItems.splice(adminNavItems.length + commonNavItems.length, 0, { 
      name: "Clients", 
      href: `/admin/organizations/${currentOrganization?.id}/clients`, 
      icon: Building 
    });
  }

  return (
    <div 
      className={cn(
        "h-screen fixed top-0 left-0 bg-background border-r transition-all duration-300 z-10",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo area */}
        <div className="h-16 border-b flex items-center px-4">
          {!collapsed && (
            <div className="font-semibold text-lg truncate">
              {currentOrganization?.name || "Medical Certificates"}
            </div>
          )}
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto">
          <div className="px-3 mb-6 flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>
          
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <TooltipProvider key={item.name} delayDuration={collapsed ? 100 : 1000}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          collapsed && "justify-center px-0"
                        )
                      }
                    >
                      <item.icon size={20} />
                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
        </div>
        
        {/* Quick help section */}
        <div className="p-4 border-t">
          <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size={collapsed ? "icon" : "default"} 
                  className={cn("w-full", collapsed && "justify-center")}
                >
                  <HelpCircle size={20} />
                  {!collapsed && <span className="ml-2">Help & Support</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>Help & Support</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
