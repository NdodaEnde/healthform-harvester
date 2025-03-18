
import { NavLink } from "react-router-dom";
import { Home, Building, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full flex items-center justify-between">
                          <span className="mr-2 truncate">
                            {currentClient ? currentClient.name : "All Clients"}
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => {
                            console.log("Switching to all clients");
                            switchClient("all_clients");
                          }}
                        >
                          All Clients
                        </DropdownMenuItem>
                        {clientOrganizations.map((client) => (
                          <DropdownMenuItem 
                            key={client.id}
                            className="cursor-pointer"
                            onClick={() => {
                              console.log("Switching to client:", client.id);
                              switchClient(client.id);
                            }}
                          >
                            {client.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
