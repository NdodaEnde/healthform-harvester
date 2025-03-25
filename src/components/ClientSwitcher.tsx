
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ClientSwitcher = () => {
  const { 
    currentClient, 
    clientOrganizations, 
    switchClient 
  } = useOrganization();

  const getClientInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Only render if we have clients to switch between
  if (!clientOrganizations || clientOrganizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 w-[180px] justify-between">
          <div className="flex items-center gap-2 max-w-[130px]">
            {currentClient ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={currentClient.logo_url || undefined} alt={currentClient.name} />
                  <AvatarFallback className="text-xs">
                    {getClientInitials(currentClient.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{currentClient.name}</span>
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                <span className="truncate">All Clients</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Switch Client</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex items-center gap-2" 
          onClick={() => switchClient('all_clients')}
        >
          <Users className="h-4 w-4" />
          <span>All Clients</span>
          {!currentClient && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {clientOrganizations.map(client => (
          <DropdownMenuItem
            key={client.id}
            className="flex items-center gap-2"
            onClick={() => switchClient(client.id)}
          >
            <Avatar className="h-4 w-4">
              <AvatarImage src={client.logo_url || undefined} alt={client.name} />
              <AvatarFallback className="text-xs">
                {getClientInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{client.name}</span>
            {currentClient && currentClient.id === client.id && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClientSwitcher;
