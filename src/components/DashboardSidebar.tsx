
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
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrganization, isServiceProvider } = useOrganization();
  
  const navItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      exact: true
    },
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
      name: "Settings", 
      href: "/settings/organization", 
      icon: Settings,
      exact: false
    }
  ];

  return (
    <div 
      className={cn(
        "h-[calc(100vh-64px)] fixed top-16 left-0 bg-background border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-6">
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
          
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
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
                end={item.exact}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
