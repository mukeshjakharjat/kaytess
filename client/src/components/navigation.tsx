import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationsPanel from "@/components/notifications-panel";
import type { User } from "@shared/schema";

interface NavigationProps {
  user?: User;
}

export default function Navigation({ user }: NavigationProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    retry: false,
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getDisplayName = (user?: User) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'User';
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/kaytess-logo.png" alt="KAYTESS Healthcare Staffing" className="h-8" />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 text-slate-400 hover:text-slate-600 relative"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount && (unreadCount as any).count > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {(unreadCount as any).count > 9 ? '9+' : (unreadCount as any).count}
                    </span>
                  )}
                </Button>
              </div>
            
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || ''} />
                  <AvatarFallback className="bg-medical-blue text-white text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">
                        {getDisplayName(user)}
                        {user?.role && (
                          <span className="text-xs text-slate-500 ml-1">
                            ({user.role.charAt(0).toUpperCase() + user.role.slice(1)})
                          </span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                    <DropdownMenuItem>Notifications</DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await fetch('/api/logout', { method: 'POST' });
                          window.location.href = '/';
                        } catch (error) {
                          window.location.href = '/api/logout';
                        }
                      }}
                      className="text-red-600"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>
        
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
}
