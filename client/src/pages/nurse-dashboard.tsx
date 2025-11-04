import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import NurseMobileFooter from "@/components/nurse-mobile-footer";
import Sidebar from "@/components/sidebar";
import EnhancedNotificationSystem from "@/components/notification-system-enhanced";
import ShiftCard from "@/components/shift-card";
import ShiftFilters from "@/components/shift-filters";
import RunningShifts from "@/components/running-shifts";
import NurseSettings from "./nurse-settings";
import CredentialsVerificationFixed from "@/components/credentials-verification-fixed";
import VerificationGuard from "@/components/verification-guard";
import { useAuth } from "@/hooks/useAuth";
import type { ShiftWithDetails, User, ShiftApplication } from "@shared/schema";

export default function NurseDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("home");
  const [filters, setFilters] = useState({
    facilityId: undefined,
    departmentId: undefined,
    date: undefined,
    minRate: undefined,
    maxRate: undefined,
    priority: undefined,
  });

  // Redirect to home if not authenticated or not nurse - but prevent during profile updates
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== 'nurse')) {
      // Don't redirect if we're on the profile tab (user might be updating profile)
      if (activeTab === "profile") {
        return;
      }
      
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, activeTab]);

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<ShiftWithDetails[]>({
    queryKey: ["/api/shifts", filters],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: myApplications = [] } = useQuery<ShiftApplication[]>({
    queryKey: ["/api/my-applications"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch running shifts count
  const { data: runningShifts = [] } = useQuery<ShiftWithDetails[]>({
    queryKey: ['/api/shifts/nurse', (user as User)?.id, 'running'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts/nurse/${(user as User)?.id}?status=in_progress,filled`);
      return response.json();
    },
    enabled: isAuthenticated && !!(user as User)?.id,
  });

  // Fetch completed shifts count
  const { data: completedShifts = [] } = useQuery<ShiftWithDetails[]>({
    queryKey: ['/api/shifts/nurse', (user as User)?.id, 'completed'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts/nurse/${(user as User)?.id}?status=completed`);
      return response.json();
    },
    enabled: isAuthenticated && !!(user as User)?.id,
  });

  const applyForShiftMutation = useMutation({
    mutationFn: async ({ shiftId, notes }: { shiftId: number; notes?: string }) => {
      await apiRequest("POST", `/api/shifts/${shiftId}/apply`, { applicationNotes: notes });
    },
    onSuccess: () => {
      toast({
        title: "Application Sent",
        description: "Your application has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Application Failed",
        description: error.message || "Failed to apply for shift",
        variant: "destructive",
      });
    },
  });

  const handleApplyForShift = (shiftId: number, notes?: string) => {
    applyForShiftMutation.mutate({ shiftId, notes });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <Navigation user={user as User} />
      </div>
      
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar userRole="nurse" activeItem={activeTab} onTabChange={setActiveTab} />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-20 lg:pb-6">
            {activeTab === "home" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-foreground">Dashboard</h2>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Available</div>
                    <div className="text-2xl font-bold text-blue-600">{shifts?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Applied</div>
                    <div className="text-2xl font-bold text-yellow-600">{myApplications?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Running</div>
                    <div className="text-2xl font-bold text-green-600">{runningShifts?.length || 0}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                    <div className="text-2xl font-bold text-gray-600">{completedShifts?.length || 0}</div>
                  </div>
                </div>
              </>
            )}

            {(activeTab === "available-shifts" || activeTab === "home") && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-foreground">
                    {activeTab === "home" ? "Recent Available Shifts" : "Available Shifts"}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {shifts?.length || 0} shifts available
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "running-shifts" && user && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Running Shifts</h2>
                    <p className="text-muted-foreground">Track your active and completed shifts with payment details</p>
                  </div>
                </div>
                <RunningShifts userId={(user as User).id} />
              </div>
            )}

            {activeTab === "notifications" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-foreground">Notifications</h2>
                </div>
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification: any) => (
                      <div key={notification.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <div className="text-gray-400 text-lg mb-2">No notifications</div>
                    <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
                  </div>
                )}
              </>
            )}

            {activeTab === "profile" && (
              <NurseSettings />
            )}

            {activeTab === "credentials" && user && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Nursing Credentials</h2>
                    <p className="text-muted-foreground">Manage your professional nursing credentials and certifications</p>
                  </div>
                </div>
                <CredentialsVerificationFixed user={user as User} userType="nurse" />
              </div>
            )}



            {/* <ShiftFilters onFilterChange={handleFilterChange} /> */}

            {shiftsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-8 bg-slate-200 rounded w-full mt-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : shifts && shifts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {shifts.map((shift: ShiftWithDetails) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onApply={handleApplyForShift}
                    isApplying={applyForShiftMutation.isPending}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 text-lg mb-2">No shifts available</div>
                <p className="text-slate-600">
                  Check back later or adjust your filters to see more opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Footer Navigation */}
      <NurseMobileFooter 
        user={user as User} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      {/* Enhanced Notification System for Browser Push Notifications */}
      {user?.id && <EnhancedNotificationSystem userId={(user as User).id} />}
    </div>
  );
}
