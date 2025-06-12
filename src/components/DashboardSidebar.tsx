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
        "fixed top-16 left-0 bg-background border-r transition-all duration-300 z-40",
        "flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        height: 'calc(100vh - 4rem)',
        minHeight: 'calc(100vh - 4rem)'
      }}
    >
      {/* FIXED: Changed to use grid layout for better space distribution */}
      <div className="h-full grid grid-rows-[auto_1fr_auto] overflow-hidden">
        
        {/* Collapse Toggle - Fixed height */}
        <div className="px-3 py-4 flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>
        
        {/* Navigation - Flexible middle section that can scroll */}
        <div className="px-2 overflow-y-auto">
          <nav className="space-y-1 pb-4">
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
        
        {/* Organization Switcher - Fixed at bottom with guaranteed space */}
        <div 
          className={cn(
            "p-4 border-t bg-background",
            collapsed && "px-2"
          )}
          style={{
            minHeight: "140px" // ✅ GUARANTEED minimum space for the switcher
          }}
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