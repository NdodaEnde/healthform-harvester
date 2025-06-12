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
import { 
  Building, 
  ChevronDown, 
  Users,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
  
  const [location] = useState(window.location.pathname);
  
  // Debug logging to check component rendering and data
  useEffect(() => {
    console.log("OrganizationSwitcher rendered at:", location);
    console.log("Current organization:", currentOrganization);
    console.log("Current client:", currentClient);
    console.log("Is service provider:", isServiceProvider());
    console.log("Client organizations:", clientOrganizations);
  }, [currentOrganization, currentClient, clientOrganizations, location]);
  
  if (!currentOrganization) {
    return (
      <div className="w-full p-3 text-center text-sm text-muted-foreground bg-gray-50 rounded-md">
        Loading organization...
      </div>
    );
  }
  
  return (
    <div className="space-y-3 w-full" data-testid="organization-switcher">
      {/* Organization selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center justify-between w-full h-10 px-3 bg-background border border-border hover:bg-accent hover:text-accent-foreground text-foreground"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-sm font-medium">{currentOrganization.name}</span>
            </div>
            {userOrganizations.length > 1 && (
              <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
            )}
          </Button>
        </DropdownMenuTrigger>
        {userOrganizations.length > 1 && (
          <DropdownMenuContent 
            align="start" 
            className="w-56 z-50 bg-popover text-popover-foreground border border-border shadow-md"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-sm font-medium">Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userOrganizations.map(org => (
              <DropdownMenuItem 
                key={org.id}
                className="flex justify-between items-center cursor-pointer text-sm py-2 px-2"
                onClick={() => switchOrganization(org.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Building className="h-4 w-4 opacity-70 flex-shrink-0" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org.id === currentOrganization.id && (
                  <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">Current</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      
      {/* Client selector (only for service providers) */}
      {isServiceProvider() && (
        <div className="w-full">
          {clientOrganizations.length > 0 ? (
            <Select
              value={currentClient ? currentClient.id : "all_clients"}
              onValueChange={(value) => {
                console.log("Switching to client:", value);
                switchClient(value);
                toast.success(
                  value === "all_clients"
                    ? "Switched to all clients view"
                    : `Switched to ${clientOrganizations.find(c => c.id === value)?.name}`
                );
              }}
            >
              <SelectTrigger className="w-full h-10 px-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-foreground">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {currentClient ? (
                    <Building2 className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Users className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                  <SelectValue className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {currentClient ? currentClient.name : "All Clients"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent 
                className="z-50 bg-popover text-popover-foreground border border-border shadow-md min-w-[200px]"
                position="popper"
                sideOffset={4}
              >
                <SelectItem value="all_clients" className="text-sm py-2 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>All Clients</span>
                  </div>
                </SelectItem>
                {clientOrganizations.map(client => (
                  <SelectItem key={client.id} value={client.id} className="text-sm py-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button 
              variant="outline" 
              disabled 
              className="w-full h-10 px-3 text-sm bg-gray-50 dark:bg-gray-900 text-muted-foreground border border-border"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">No Clients</span>
              </div>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}