
import { NavLink } from "react-router-dom";
import { Building, FileText, Shield, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";

export function Sidebar() {
  const { isServiceProvider } = useOrganization();
  
  const navItems = [
    {
      title: "Documents",
      href: "/dashboard",
      icon: FileText
    },
    {
      title: "Organizations",
      href: "/admin/organizations",
      icon: Building,
      admin: true
    },
    {
      title: "Users",
      href: "/admin/organizations/:id/users",
      icon: Users,
      admin: true
    },
    {
      title: "Security",
      href: "/dashboard?tab=security",
      icon: Shield
    },
    {
      title: "Settings",
      href: "/settings/organization",
      icon: Settings
    }
  ];
  
  return (
    <aside className="w-64 hidden md:block border-r h-[calc(100vh-64px)] fixed top-16 left-0 bg-background">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href.replace(':id', '')}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
