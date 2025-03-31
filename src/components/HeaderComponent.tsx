
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import OrganizationSwitcher from './OrganizationSwitcher';
import { 
  LogOut, 
  User, 
  Bell, 
  Settings, 
  HelpCircle, 
  UserPlus 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

const HeaderComponent: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const [notifications] = useState([
    { id: 1, title: "New patient added", time: "10 minutes ago", read: false },
    { id: 2, title: "Certificate needs review", time: "1 hour ago", read: false },
    { id: 3, title: "System maintenance scheduled", time: "Yesterday", read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.substring(0, 2).toUpperCase();
  };

  const getUsername = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20 h-16">
      <div className="flex items-center justify-between h-full px-4 md:px-6 ml-16 md:ml-64">
        {/* Left side - Quick search or breadcrumbs could go here */}
        <div>
          {/* This area could contain breadcrumbs or page title */}
        </div>
        
        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-2 bg-red-500 text-white text-xs"
                        variant="destructive"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="flex items-center justify-between border-b p-3">
                    <h3 className="font-medium">Notifications</h3>
                    <Button variant="ghost" size="sm">Mark all as read</Button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div>
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 border-b last:border-0 hover:bg-accent cursor-pointer ${
                              !notification.read ? "bg-muted/50" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="font-medium">{notification.title}</div>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {notification.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="border-t p-2">
                    <Button variant="ghost" size="sm" className="w-full">
                      View all notifications
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Organization Switcher */}
              {currentOrganization && (
                <OrganizationSwitcher />
              )}
              
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={getUsername()} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p>{getUsername()}</p>
                      <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings/organization')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => window.open('/help', '_blank')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderComponent;
