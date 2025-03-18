
import { NavLink } from "react-router-dom";
import { Home, Building } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Sidebar() {
  const { currentOrganization, currentClient, switchClient, clientOrganizations } = useOrganization();
  
  return (
    <aside className="w-64 hidden md:block border-r h-[calc(100vh-64px)] fixed top-16 left-0 bg-background">
      <div className="p-4">
        <nav className="space-y-8">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold px-2">Main</h4>
            <div className="space-y-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <Home className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/organizations"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )
                }
              >
                <Building className="h-4 w-4" />
                Organizations
              </NavLink>
            </div>
          </div>
          
          {currentOrganization?.organization_type === "service_provider" && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold px-2">Clients</h4>
              <div className="space-y-1">
                {clientOrganizations.length > 0 ? (
                  <Select 
                    onValueChange={switchClient} 
                    defaultValue={currentClient?.id || "all_clients"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_clients">All Clients</SelectItem>
                      {clientOrganizations.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground px-3 py-2">No clients available</p>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
