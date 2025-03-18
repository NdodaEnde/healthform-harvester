
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, ChevronDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OrganizationSwitcher() {
  const { 
    currentOrganization,
    currentClient,
    userOrganizations,
    clientOrganizations,
    switchOrganization,
    switchClient,
    isServiceProvider
  } = useOrganization();
  
  if (!currentOrganization) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Organization selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 max-w-[200px]">
            <Building className="h-4 w-4" />
            <span className="truncate">{currentOrganization.name}</span>
            {userOrganizations.length > 1 && (
              <ChevronDown className="h-4 w-4 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        {userOrganizations.length > 1 && (
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userOrganizations.map(org => (
              <DropdownMenuItem 
                key={org.id}
                className="flex justify-between items-center cursor-pointer"
                onClick={() => switchOrganization(org.id)}
              >
                <div className="flex items-center truncate">
                  <Building className="h-4 w-4 mr-2 opacity-70" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org.id === currentOrganization.id && (
                  <Badge variant="secondary" className="ml-2">Current</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      
      {/* Client selector (only for service providers) */}
      {isServiceProvider() && clientOrganizations.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 max-w-[200px]">
              <Users className="h-4 w-4" />
              <span className="truncate">
                {currentClient ? currentClient.name : "All Clients"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => switchClient("all_clients")}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 opacity-70" />
                <span>All Clients</span>
              </div>
              {!currentClient && (
                <Badge variant="secondary" className="ml-2">Current</Badge>
              )}
            </DropdownMenuItem>
            {clientOrganizations.map(client => (
              <DropdownMenuItem 
                key={client.id}
                className="flex justify-between items-center cursor-pointer"
                onClick={() => {
                  console.log("OrganizationSwitcher - Switching to client:", client.id);
                  switchClient(client.id);
                }}
              >
                <div className="flex items-center truncate">
                  <Building className="h-4 w-4 mr-2 opacity-70" />
                  <span className="truncate">{client.name}</span>
                </div>
                {currentClient?.id === client.id && (
                  <Badge variant="secondary" className="ml-2">Current</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
