import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  UserCheck, 
  Briefcase,
  Send,
  TestTube
} from "lucide-react";

interface NotificationTesterProps {
  userId: string;
  userRole: string;
}

export default function NotificationTester({ userId, userRole }: NotificationTesterProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("");

  const createTestNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      await apiRequest("POST", "/api/notifications/test", notificationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "Test notification sent",
        description: "Check your browser notifications and notification panel",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send test notification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testNotifications = [
    {
      type: "new_shift",
      title: "New Shift Available",
      message: "New shift posted at Memorial Hospital - ICU on 01/02/2025. Rate: $45/hour",
      icon: <Briefcase className="h-4 w-4" />,
      color: "bg-blue-500",
      audience: "nurses"
    },
    {
      type: "new_application", 
      title: "New Shift Application",
      message: "Sarah Johnson has applied for your shift at Memorial Hospital - ICU on 01/02/2025.",
      icon: <Send className="h-4 w-4" />,
      color: "bg-purple-500",
      audience: "nursing_homes"
    },
    {
      type: "application_submitted",
      title: "Application Submitted",
      message: "Your application for Memorial Hospital - ICU on 01/02/2025 has been submitted successfully.",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-500",
      audience: "nurses"
    },
    {
      type: "shift_approved",
      title: "Shift Application Approved",
      message: "Congratulations! Your application for Memorial Hospital - ICU on 01/02/2025 has been approved.",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-600",
      audience: "nurses"
    },
    {
      type: "shift_rejected",
      title: "Shift Application Update",
      message: "Your application for Memorial Hospital - ICU on 01/02/2025 was not selected. Thank you for your interest.",
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-500",
      audience: "nurses"
    },
    {
      type: "payment_received",
      title: "Payment Received",
      message: "You've received payment of $360.00 for shift #123. Payment has been processed successfully.",
      icon: <DollarSign className="h-4 w-4" />,
      color: "bg-emerald-500",
      audience: "nurses"
    },
    {
      type: "verification_update",
      title: "Verification Approved",
      message: "Congratulations! Your credentials have been verified and approved. You can now apply for shifts.",
      icon: <UserCheck className="h-4 w-4" />,
      color: "bg-indigo-500",
      audience: "all"
    }
  ];

  const handleSendTestNotification = (notification: any) => {
    createTestNotificationMutation.mutate({
      userId: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
    setSelectedType(notification.type);
  };

  const relevantNotifications = testNotifications.filter(notif => 
    notif.audience === "all" || 
    notif.audience === userRole || 
    (userRole === "admin" && notif.audience === "nursing_homes")
  );

  return (
    <Card className="w-full max-w-2xl dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 dark:text-white">
          <TestTube className="h-5 w-5" />
          <span>Push Notification Tester</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test push notifications for all task activities. Make sure browser notifications are enabled.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {relevantNotifications.map((notification, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${notification.color} text-white`}>
                  {notification.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm dark:text-white">{notification.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {notification.message}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {notification.type}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleSendTestNotification(notification)}
                disabled={createTestNotificationMutation.isPending}
                className="ml-3"
              >
                {createTestNotificationMutation.isPending && selectedType === notification.type ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-1" />
                    Test
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How to Test:</h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Click "Test" on any notification type above</li>
            <li>2. Check your browser for push notification popup</li>
            <li>3. Check the notification bell in the top navigation</li>
            <li>4. Notifications appear in real-time during actual app usage</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}