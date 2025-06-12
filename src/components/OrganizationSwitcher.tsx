
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
  
  const [isSelectOpen, setIsSelectOpen] = useState(false);
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
    return null;
  }
  
  return (
    <div 
      className="flex flex-col space-y-3 w-full min-w-[220px] max-w-[280px] relative" 
      data-testid="organization-switcher"
    >
      {/* Organization selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 w-full border-gray-300 justify-between h-10"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <Building className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">{currentOrganization.name}</span>
            </div>
            {userOrganizations.length > 1 && (
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            )}
          </Button>
        </DropdownMenuTrigger>
        {userOrganizations.length > 1 && (
          <DropdownMenuContent 
            align="start" 
            className="w-[280px] z-[9999] bg-white dark:bg-gray-800 shadow-lg border"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-sm">Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userOrganizations.map(org => (
              <DropdownMenuItem 
                key={org.id}
                className="flex justify-between items-center cursor-pointer text-sm py-2"
                onClick={() => switchOrganization(org.id)}
              >
                <div className="flex items-center truncate flex-1">
                  <Building className="h-4 w-4 mr-2 opacity-70" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org.id === currentOrganization.id && (
                  <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      
      {/* Client selector (only for service providers) - with enhanced visibility */}
      {isServiceProvider() && (
        <div className="w-full relative">
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
              open={isSelectOpen}
              onOpenChange={setIsSelectOpen}
            >
              <SelectTrigger 
                className="w-full flex items-center gap-2 bg-blue-50 border-blue-200 shadow-sm 
                  dark:bg-blue-900/30 dark:border-blue-800 h-10"
              >
                <div className="flex items-center gap-2 flex-1">
                  {currentClient ? (
                    <Building2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <Users className="h-4 w-4 shrink-0" />
                  )}
                  <SelectValue placeholder="Select client" className="text-foreground font-medium text-sm">
                    {currentClient ? currentClient.name : "All Clients"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                  shadow-lg z-[9999] w-[280px] max-h-[300px]"
                position="popper"
                sideOffset={4}
              >
                <SelectItem value="all_clients" className="text-sm py-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>All Clients</span>
                  </div>
                </SelectItem>
                {clientOrganizations.map(client => (
                  <SelectItem key={client.id} value={client.id} className="text-sm py-2">
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
              className="w-full flex items-center gap-2 h-10 text-sm"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">No Clients</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
