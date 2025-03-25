
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Retrieve user ID
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data && notification.data.path) {
      navigate(notification.data.path);
    }
    
    setOpen(false);
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h4 className="text-sm font-medium">Notifications</h4>
        </div>
        <div className="max-h-96 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-sm font-medium">
                      {notification.title}
                      {!notification.is_read && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </h5>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t p-2">
          <Button variant="link" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Clear All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
