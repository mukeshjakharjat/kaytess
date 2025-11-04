import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Home, Calendar, Clock, Bell, User, LogOut, Sun, Moon, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NurseMobileFooterProps {
  user?: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function NurseMobileFooter({ user, activeTab, onTabChange }: NurseMobileFooterProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out.",
      });
      // Force page reload to clear React state and redirect to login
      window.location.replace("/");
    } catch (error) {
      // Fallback logout method
      window.location.href = "/api/logout";
    }
  };

  const footerItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "available-shifts", label: "Shifts", icon: Calendar },
    { id: "running-shifts", label: "Running", icon: Clock },
    { id: "notifications", label: "Alerts", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Footer Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card dark:bg-card border-t border-border z-50">
        <div className="grid grid-cols-5 h-16">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`h-full rounded-none flex flex-col items-center justify-center gap-1 ${
                  isActive 
                    ? "text-primary bg-primary/10 dark:bg-primary/20" 
                    : "text-muted-foreground"
                }`}
                onClick={() => {
                  if (item.id === "profile") {
                    setShowProfile(!showProfile);
                  } else {
                    onTabChange(item.id);
                    setShowProfile(false);
                  }
                }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Profile Popup */}
      {showProfile && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-card dark:bg-card border-t border-border z-50 p-4">
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start h-11"
                onClick={() => {
                  onTabChange("profile");
                  setShowProfile(false);
                }}
              >
                <User className="h-4 w-4 mr-3" />
                Account Settings
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-11"
                onClick={() => {
                  onTabChange("credentials");
                  setShowProfile(false);
                }}
              >
                <Award className="h-4 w-4 mr-3" />
                Credentials
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-11"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4 mr-3" />
                ) : (
                  <Sun className="h-4 w-4 mr-3" />
                )}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-11 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {showProfile && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Bottom padding for content */}
      <div className="lg:hidden h-16" />
    </>
  );
}