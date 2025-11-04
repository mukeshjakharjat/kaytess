import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, AlertTriangle, Info, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

interface NotificationSystemProps {
  userId: string;
}

// Enhanced Push notification service with comprehensive task notifications
class EnhancedPushNotificationService {
  private static instance: EnhancedPushNotificationService;
  private permission: NotificationPermission = "default";

  private constructor() {
    this.requestPermission();
  }

  static getInstance(): EnhancedPushNotificationService {
    if (!EnhancedPushNotificationService.instance) {
      EnhancedPushNotificationService.instance = new EnhancedPushNotificationService();
    }
    return EnhancedPushNotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ("Notification" in window) {
      this.permission = await Notification.requestPermission();
    }
    return this.permission;
  }

  // Play audio notification sound
  private playNotificationSound(type: string) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sound patterns for different notification types
      const soundConfig = this.getSoundConfig(type);
      
      oscillator.frequency.setValueAtTime(soundConfig.frequency, audioContext.currentTime);
      oscillator.type = soundConfig.waveType;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundConfig.duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + soundConfig.duration);
      
      // For important notifications, play multiple beeps
      if (soundConfig.repeat > 1) {
        for (let i = 1; i < soundConfig.repeat; i++) {
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(soundConfig.frequency, audioContext.currentTime);
            osc.type = soundConfig.waveType;
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + soundConfig.duration);
            osc.start();
            osc.stop(audioContext.currentTime + soundConfig.duration);
          }, i * 300);
        }
      }
    } catch (error) {
      console.log("Audio notification not available:", error);
    }
  }

  private getSoundConfig(type: string) {
    const configs: Record<string, { frequency: number; duration: number; waveType: OscillatorType; repeat: number }> = {
      'shift_approved': { frequency: 800, duration: 0.3, waveType: 'sine', repeat: 2 },
      'shift_rejected': { frequency: 300, duration: 0.5, waveType: 'sawtooth', repeat: 1 },
      'payment_received': { frequency: 1000, duration: 0.2, waveType: 'sine', repeat: 3 },
      'shift_application': { frequency: 600, duration: 0.25, waveType: 'triangle', repeat: 1 },
      'verification_update': { frequency: 750, duration: 0.3, waveType: 'sine', repeat: 2 },
      'default': { frequency: 500, duration: 0.2, waveType: 'sine', repeat: 1 }
    };
    return configs[type] || configs.default;
  }

  showNotification(title: string, body: string, type: string = "info") {
    // Play audio notification first
    this.playNotificationSound(type);
    
    if (this.permission === "granted" && "Notification" in window) {
      const options: NotificationOptions = {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `kaytess-${type}`,
        requireInteraction: ["shift_approved", "shift_rejected", "payment_received", "verification_update"].includes(type),
        silent: false,
        data: { type, timestamp: Date.now() },
      };

      const notification = new Notification(title, options);
      
      // Auto-close after 10 seconds for non-critical notifications
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    }
    return null;
  }

  private getNotificationActions(type: string) {
    switch (type) {
      case "new_application":
        return [
          { action: "view", title: "View Application" },
          { action: "dismiss", title: "Dismiss" }
        ];
      case "shift_approved":
      case "shift_rejected":
        return [
          { action: "view", title: "View Details" },
          { action: "dismiss", title: "Dismiss" }
        ];
      case "new_shift":
        return [
          { action: "apply", title: "Apply Now" },
          { action: "view", title: "View Shift" }
        ];
      default:
        return [];
    }
  }
}

export function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCountData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const unreadCount = (unreadCountData as { count: number })?.count || 0;

  return (
    <div className="relative">
      <Button 
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <NotificationPanel userId={userId} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}

function NotificationPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const notifications = (notificationsData as Notification[]) || [];

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "shift_approved":
      case "verification_update":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "shift_rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "new_application":
      case "new_shift":
      case "payment_received":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-80 max-h-96">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 max-h-96 dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium dark:text-white">Notifications</CardTitle>
          <div className="flex items-center space-x-2">
            {notifications.some((n: Notification) => !n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium dark:text-white ${!notification.isRead ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {notification.createdAt && new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function NotificationListener({ userId }: { userId: string }) {
  const { data: notificationsData = [] } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000, // Poll more frequently for real-time notifications
  });

  const notifications = (notificationsData as Notification[]) || [];
  const pushService = EnhancedPushNotificationService.getInstance();

  useEffect(() => {
    // Show push notifications for unread notifications
    const unreadNotifications = notifications.filter((n: Notification) => !n.isRead);
    
    unreadNotifications.forEach((notification: Notification) => {
      // Only show push notification if it's recent (within last 30 seconds)
      const isRecent = notification.createdAt && 
        (Date.now() - new Date(notification.createdAt).getTime()) < 30000;
      
      if (isRecent) {
        pushService.showNotification(
          notification.title,
          notification.message,
          notification.type
        );
      }
    });
  }, [notifications]);

  return null; // This is a listener component, no UI
}

export default function EnhancedNotificationSystem({ userId }: NotificationSystemProps) {
  return (
    <>
      <NotificationBell userId={userId} />
      <NotificationListener userId={userId} />
    </>
  );
}