import { Calendar, Clock, History, User, BarChart3, Users, Plus, Home, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: "nurse" | "admin";
  activeItem?: string;
  onTabChange?: (tab: string) => void;
}

export default function Sidebar({ userRole, activeItem = "dashboard", onTabChange }: SidebarProps) {
  const nurseNavItems = [
    { id: "home", label: "Dashboard", icon: Home, tab: "home", href: null },
    { id: "available-shifts", label: "Available Shifts", icon: Calendar, tab: "available-shifts", href: null },
    { id: "running-shifts", label: "Running Shifts", icon: Clock, tab: "running-shifts", href: null },
    { id: "credentials", label: "Credentials", icon: Award, tab: "credentials", href: null },
    { id: "profile", label: "Profile", icon: User, tab: "profile", href: null },
  ];

  const adminNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/", tab: null },
    { id: "nurses", label: "Manage Nurses", icon: Users, href: "/nurses", tab: null },
    { id: "create", label: "Create Shifts", icon: Plus, href: "/create", tab: null },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/reports", tab: null },
  ];

  const navItems = userRole === "nurse" ? nurseNavItems : adminNavItems;

  return (
    <div className="w-64 bg-white shadow-sm border-r border-slate-200">
      <nav className="mt-8">
        <div className="px-4 mb-6">
          <div className="bg-slate-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Role:</span>
              <span className="text-sm font-semibold text-medical-blue capitalize">
                {userRole}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            if (userRole === "nurse" && item.tab && onTabChange) {
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.tab)}
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors text-left",
                    isActive
                      ? "text-medical-blue bg-blue-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              );
            }
            
            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "text-medical-blue bg-blue-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
