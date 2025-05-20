
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
import { useState } from "react";
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
  
  if (!currentOrganization) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
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
      {isServiceProvider() && (
        <div className="relative">
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
              <SelectTrigger className="w-full md:w-[200px] flex items-center gap-2 bg-background border-input shadow-sm">
                <div className="flex items-center gap-2">
                  {currentClient ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  <SelectValue placeholder="Select client" className="text-foreground font-medium">
                    {currentClient ? currentClient.name : "All Clients"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-md">
                <SelectItem value="all_clients" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 inline" />
                    <span>All Clients</span>
                  </div>
                </SelectItem>
                {clientOrganizations.map(client => (
                  <SelectItem key={client.id} value={client.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 inline" />
                      <span className="truncate">{client.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Button variant="outline" disabled className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate">No Clients</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
