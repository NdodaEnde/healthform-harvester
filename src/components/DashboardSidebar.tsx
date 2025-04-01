
import { NavLink, useLocation } from "react-router-dom";
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
  ClipboardList,
  BookMedical,
  BarChart,
  HelpCircle,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useUserRole } from "@/utils/roleUtils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrganization, isServiceProvider } = useOrganization();
  const location = useLocation();
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  
  // Common navigation items for all roles
  const commonNavItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      exact: true
    }
  ];
  
  // Role-specific navigation items
  const getRoleNavItems = () => {
    if (roleLoading) return [];
    
    // Admin role items
    if (role === 'admin') {
      return [
        { 
          name: "Documents", 
          href: "/documents", 
          icon: FileText,
          exact: false
        },
        {
          name: "Patients",
          href: "/patients",
          icon: UserRound,
          exact: false
        },
        {
          name: "Certificate Templates",
          href: "/certificates/templates",
          icon: ScrollText,
          exact: false
        },
        ...(isServiceProvider() ? [
          { 
            name: "Organizations", 
            href: "/admin/organizations", 
            icon: Building,
            exact: false
          },
          { 
            name: "Clients", 
            href: `/admin/organizations/${currentOrganization?.id}/clients`, 
            icon: Building,
            exact: false
          },
          { 
            name: "Users", 
            href: `/admin/organizations/${currentOrganization?.id}/users`, 
            icon: Users,
            exact: false
          }
        ] : []),
        { 
          name: "Analytics", 
          href: "/analytics", 
          icon: BarChart,
          exact: false,
          badge: "New"
        },
        { 
          name: "Settings", 
          href: "/settings/organization", 
          icon: Settings,
          exact: false
        }
      ];
    }
    
    // Clinician role items
    if (role === 'clinician') {
      return [
        {
          name: "Patients",
          href: "/patients",
          icon: UserRound,
          exact: false
        },
        { 
          name: "Appointments", 
          href: "/appointments", 
          icon: Calendar,
          exact: false,
          badge: "New"
        },
        { 
          name: "Documents", 
          href: "/documents", 
          icon: FileText,
          exact: false
        },
        {
          name: "Medical Records",
          href: "/medical-records",
          icon: BookMedical,
          exact: false,
          badge: "New"
        }
      ];
    }
    
    // Staff role items
    if (role === 'staff') {
      return [
        { 
          name: "Documents", 
          href: "/documents", 
          icon: FileText,
          exact: false
        },
        {
          name: "Patients",
          href: "/patients",
          icon: UserRound,
          exact: false
        },
        { 
          name: "Appointments", 
          href: "/appointments", 
          icon: Calendar,
          exact: false,
          badge: "New"
        },
        {
          name: "Tasks",
          href: "/tasks",
          icon: ClipboardList,
          exact: false,
          badge: "New"
        }
      ];
    }
    
    // Client role items
    if (role === 'client') {
      return [
        { 
          name: "Documents", 
          href: "/documents", 
          icon: FileText,
          exact: false
        },
        {
          name: "Employees",
          href: "/employees",
          icon: Users,
          exact: false,
          badge: "New"
        },
        { 
          name: "Reports", 
          href: "/reports", 
          icon: Activity,
          exact: false,
          badge: "New"
        }
      ];
    }
    
    // Default items if role is not determined
    return [
      { 
        name: "Documents", 
        href: "/documents", 
        icon: FileText,
        exact: false
      },
      {
        name: "Patients",
        href: "/patients",
        icon: UserRound,
        exact: false
      },
      {
        name: "Certificate Templates",
        href: "/certificates/templates",
        icon: ScrollText,
        exact: false
      }
    ];
  };
  
  // Footer items that appear at the bottom of the sidebar
  const footerNavItems = [
    { 
      name: "Help & Support", 
      href: "/support", 
      icon: HelpCircle,
      exact: true
    },
    { 
      name: "Notifications", 
      href: "/notifications", 
      icon: Bell,
      exact: true,
      badge: "3"
    }
  ];
  
  // Combine common items with role-specific items
  const navItems = [...commonNavItems, ...getRoleNavItems()];

  return (
    <div 
      className={cn(
        "h-[calc(100vh-64px)] fixed top-16 left-0 bg-background border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 py-6 overflow-y-auto">
        <div className="px-3 mb-6 flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        
        {/* User info section */}
        {!collapsed && (
          <div className="px-4 mb-6">
            <div className="text-sm font-medium truncate">
              {user?.email}
            </div>
            {role && (
              <div className="text-xs text-muted-foreground">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            )}
          </div>
        )}
        
        {/* Main navigation items */}
        <nav className="space-y-1 px-2 mb-6">
          {navItems.map((item) => {
            // Check if the current path matches this nav item
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
                end={item.exact}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Footer navigation items */}
        <div className="px-2 mt-auto">
          {!collapsed && <div className="h-px bg-border mb-2"></div>}
          {footerNavItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
                end={item.exact}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
