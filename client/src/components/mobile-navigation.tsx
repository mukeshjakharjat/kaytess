import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Sun, Moon, LogOut, User, Plus, Users, FileText, BarChart3, Stethoscope } from "lucide-react";

interface MobileNavigationProps {
  user?: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function MobileNavigation({ user, activeTab, onTabChange, onLogout }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "create-shift", label: "Create Shifts", icon: Plus },
    { id: "manage-shifts", label: "Manage Shifts", icon: Stethoscope },
    { id: "manage-nurses", label: "Manage Nurses", icon: Users },
    { id: "review-applications", label: "Review Applications", icon: FileText },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-card dark:bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/kaytess-logo.png" alt="KAYTESS" className="h-6" />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="h-9 w-9 p-0"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {user?.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Menu */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Navigation
                    </h3>
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start h-11 ${
                            isActive 
                              ? "bg-primary/10 dark:bg-primary/20 text-primary" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => handleTabChange(item.id)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Logout */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-11 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        onLogout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Tab Indicator */}
      <div className="lg:hidden bg-card dark:bg-card border-b border-border px-4 py-2">
        <p className="text-sm font-medium text-muted-foreground">
          {menuItems.find(item => item.id === activeTab)?.label || "Dashboard"}
        </p>
      </div>
    </>
  );
}