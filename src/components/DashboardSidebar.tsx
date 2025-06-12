
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
  BarChart3 as BarChart,
  PieChart,
  LineChart,
  Stethoscope,
  ActivitySquare,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import OrganizationSwitcher from "@/components/OrganizationSwitcher";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrganization, isServiceProvider } = useOrganization();
  
const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard 
  },
  { 
    name: "Documents", 
    href: "/documents", 
    icon: FileText 
  },
  {
    name: "Patients",
    href: "/patients",
    icon: UserRound
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart
  },
  {
    name: "Clinical Analytics",
    href: "/clinical-analytics",
    icon: ActivitySquare
  },
  {
    name: "Occupational Health",
    href: "/integrated-occupational-health",
    icon: HardHat
  },
  {
    name: "Reports",
    href: "/reports",
    icon: PieChart
  },
  {
    name: "Certificate Templates",
    href: "/certificates/templates",
    icon: ScrollText
  },
  ...(isServiceProvider ? [
    { 
      name: "Organizations", 
      href: "/admin/organizations", 
      icon: Building
    },
    { 
      name: "Clients", 
      href: `/admin/organizations/${currentOrganization?.id}/clients`, 
      icon: Building 
    },
    { 
      name: "Users", 
      href: "/admin/users",
      icon: Users 
    }
  ] : []),
  { 
    name: "Settings", 
    href: "/settings/organization", 
    icon: Settings 
  }
];

  return (
    <div 
      className={cn(
        "min-h-screen fixed top-16 left-0 bg-background border-r transition-all duration-300 z-40",
        "flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        height: 'calc(100vh - 4rem)',
        maxHeight: 'calc(100vh - 4rem)'
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
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
                    collapsed && "justify-center px-0",
                    item.name === "Patients" && isActive && "bg-purple-100 text-purple-800",
                    item.name === "Occupational Health" && isActive && "bg-blue-100 text-blue-800"
                  )
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* Organization switcher at bottom - simplified positioning */}
        <div 
          className={cn(
            "p-4 border-t bg-background shrink-0", 
            collapsed && "items-center justify-center px-2"
          )}
        >
          {!collapsed && (
            <>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                ORGANIZATION
              </div>
              <OrganizationSwitcher />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardSidebar;
