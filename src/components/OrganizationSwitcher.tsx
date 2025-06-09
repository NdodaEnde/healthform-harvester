// src/components/OrganizationSwitcher.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Building2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/contexts/OrganizationContext";

const OrganizationSwitcher = () => {
  const { 
    currentOrganization, 
    currentClient, 
    userOrganizations, 
    clientOrganizations, 
    switchOrganization, 
    switchClient, 
    isServiceProvider 
  } = useOrganization();

  const isCurrentServiceProvider = isServiceProvider();

  if (!currentOrganization) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
        <div className="space-y-1">
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-2 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Custom styles for the dropdown content to ensure proper z-index and positioning
  const dropdownContentStyles = {
    zIndex: 9999,
    position: 'fixed' as const,
    backgroundColor: 'white',
    border: '1px solid hsl(var(--border))',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Organization Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start px-2 py-1 h-auto text-left hover:bg-accent"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={currentOrganization.logo_url} />
                <AvatarFallback className="text-xs">
                  {currentOrganization.name?.charAt(0)?.toUpperCase() || 'O'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {currentOrganization.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentOrganization.organization_type === 'service_provider' 
                    ? 'Service Provider' 
                    : 'Client'
                  }
                </p>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        {/* Use Portal to render outside the sidebar container and apply custom styles */}
        <DropdownMenuPortal>
          <DropdownMenuContent 
            className="w-64"
            style={dropdownContentStyles}
            sideOffset={5}
            align="start"
            avoidCollisions={true}
            collisionPadding={20}
          >
            <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {userOrganizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-2 w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={org.logo_url} />
                    <AvatarFallback className="text-xs">
                      {org.name?.charAt(0)?.toUpperCase() || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {org.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {org.organization_type === 'service_provider' 
                        ? 'Service Provider' 
                        : 'Client'
                      }
                    </p>
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      {/* Client Selector - Only show for service providers */}
      {isCurrentServiceProvider && clientOrganizations.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto text-left hover:bg-accent"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-none truncate">
                    {currentClient ? currentClient.name : 'All Clients'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Client View
                  </p>
                </div>
                <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          {/* Use Portal for client dropdown as well */}
          <DropdownMenuPortal>
            <DropdownMenuContent 
              className="w-64"
              style={dropdownContentStyles}
              sideOffset={5}
              align="start"
              avoidCollisions={true}
              collisionPadding={20}
            >
              <DropdownMenuLabel>Switch Client View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => switchClient("all_clients")}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-2 w-full">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">All Clients</span>
                  {!currentClient && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {clientOrganizations.map((client) => (
                <DropdownMenuItem
                  key={client.id}
                  onClick={() => switchClient(client.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={client.logo_url} />
                      <AvatarFallback className="text-[10px]">
                        {client.name?.charAt(0)?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{client.name}</span>
                    {currentClient?.id === client.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>
      )}
    </div>
  );
};

export default OrganizationSwitcher;