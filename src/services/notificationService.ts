
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Notification {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Notification[];
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function createNotification(notification: Omit<Notification, "id" | "created_at" | "is_read">) {
  try {
    const notificationToCreate = {
      ...notification,
      is_read: false,
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert(notificationToCreate)
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userData.user.id)
      .eq("is_read", false);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

export async function deleteNotification(id: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return false;
  }
}
