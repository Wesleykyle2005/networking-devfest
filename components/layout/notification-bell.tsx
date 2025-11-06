"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "connection_request" | "connection_accepted";
  actor_id: string;
  reference_id: string;
  read: boolean;
  created_at: string;
  actor: {
    name: string;
    avatar_url: string | null;
    slug_uuid: string;
  }[];
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/api/notifications");
      if (response.ok) {
        const data: NotificationsResponse = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    // Initial fetch
    fetchNotifications();

    console.log('🚀 Setting up Realtime and polling...');

    // Set up Realtime subscription for instant notifications
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Clean up existing channel if any
      if (channel) {
        await supabase.removeChannel(channel);
      }

      channel = supabase
        .channel(`notifications:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 New notification received!', payload.new);
            // Fetch fresh notifications when a new one arrives
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('📝 Notification updated:', payload.new);
            // Update local state when notification is marked as read
            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === payload.new.id ? { ...n, ...payload.new } : n
                )
              );
              if ('read' in payload.new && payload.new.read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime CONNECTED - Notifications will arrive instantly!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime ERROR:', err);
            // Attempt to reconnect after 5 seconds
            reconnectTimeout = setTimeout(() => {
              console.log('🔄 Attempting to reconnect Realtime...');
              setupRealtime();
            }, 5000);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Realtime TIMED OUT - Reconnecting...');
            // Attempt to reconnect immediately
            reconnectTimeout = setTimeout(() => {
              setupRealtime();
            }, 1000);
          } else if (status === 'CLOSED') {
            console.log('🔌 Realtime connection CLOSED');
          } else {
            console.log('🔄 Realtime status:', status);
          }
        });
    };

    setupRealtime();

    // Fallback polling every 60 seconds (reduced from 30s since we have Realtime)
    // This ensures we don't miss anything if Realtime fails
    const interval = setInterval(() => {
      if (isSubscribed) {
        console.log('⏰ Fallback poll (every 60s)');
        fetchNotifications();
      }
    }, 60000);

    return () => {
      console.log('🧹 Cleaning up Realtime and polling...');
      isSubscribed = false;
      clearInterval(interval);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        supabase.removeChannel(channel).catch(console.error);
      }
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor[0]?.name || "Alguien";

    switch (notification.type) {
      case "connection_request":
        return `${actorName} te envió una solicitud de conexión`;
      case "connection_accepted":
        return `${actorName} aceptó tu solicitud de conexión`;
      default:
        return "Nueva notificación";
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "connection_request":
        return "/conexiones?tab=pendientes";
      case "connection_accepted":
        return "/conexiones";
      default:
        return "/conexiones";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {notifications.map((notification) => {
              const actor = notification.actor[0];
              const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: es,
              });

              return (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="cursor-pointer"
                >
                  <Link
                    href={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                    }}
                    className={`flex gap-3 p-3 ${!notification.read ? "bg-primary/5" : ""
                      }`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={actor?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight">
                        {getNotificationText(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/conexiones"
                className="w-full text-center text-sm text-primary"
                onClick={() => setIsOpen(false)}
              >
                Ver todas las conexiones
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
