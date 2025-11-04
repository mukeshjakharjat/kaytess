import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import MobileNavigation from "@/components/mobile-navigation";
import CreateShiftForm from "@/components/create-shift-form";
import UserManagement from "@/components/user-management";
import ApplicationsReview from "@/components/applications-review";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Users, Clock, TrendingUp, ClipboardList, Trash2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { ShiftWithDetails } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      // Clear any cached user data
      queryClient.clear();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out.",
      });
      // Force page reload to clear all state
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect to home if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  const { data: recentShifts } = useQuery({
    queryKey: ["/api/shifts"],
    retry: false,
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  const { data: allShifts } = useQuery({
    queryKey: ["/api/shifts", "all"],
    retry: false,
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'filled':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      await apiRequest("DELETE", `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      toast({
        title: "Shift Deleted",
        description: "The shift has been successfully deleted.",
      });
      // Refresh the shifts data
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", "all"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete shift. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNavigation 
        user={user} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <Navigation user={user} />
      </div>
      
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage shifts, nurses, and review applications</p>
        </div>

        {/* Content Based on Active Tab */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.totalShifts || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.openShifts || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Filled Shifts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.filledShifts || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(stats as any)?.pendingShifts || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentShifts && Array.isArray(recentShifts) && recentShifts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Facility</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentShifts.map((shift: ShiftWithDetails) => (
                          <TableRow key={shift.id}>
                            <TableCell className="font-medium">{shift.facility?.name}</TableCell>
                            <TableCell>{shift.department?.name}</TableCell>
                            <TableCell>{new Date(shift.shiftDate).toLocaleDateString()}</TableCell>
                            <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                            <TableCell>${shift.hourlyRate}/hr</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(shift.status)}>
                                {shift.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No shifts found</p>
                      <p className="text-sm text-muted-foreground mt-2">Create your first shift to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "create-shift" && <CreateShiftForm />}
          
          {activeTab === "manage-shifts" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Shift Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Manage all shifts in the system</p>
                </CardHeader>
                <CardContent>
                  {allShifts && Array.isArray(allShifts) && allShifts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Facility</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allShifts.map((shift: ShiftWithDetails) => (
                          <TableRow key={shift.id}>
                            <TableCell className="font-medium">{shift.facility?.name}</TableCell>
                            <TableCell>{shift.department?.name}</TableCell>
                            <TableCell>{new Date(shift.shiftDate).toLocaleDateString()}</TableCell>
                            <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                            <TableCell>${shift.hourlyRate}/hr</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(shift.status)}>
                                {shift.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!!shift.assignedTo}
                                    data-testid={`delete-shift-${shift.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-red-600" />
                                      Delete Shift
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this shift at <strong>{shift.facility?.name}</strong> on{" "}
                                      <strong>{new Date(shift.shiftDate).toLocaleDateString()}</strong>?
                                      {shift.assignedTo && (
                                        <div className="text-red-600 font-medium mt-2">
                                          ⚠️ This shift is currently assigned to a nurse and cannot be deleted.
                                        </div>
                                      )}
                                      {!shift.assignedTo && shift.status !== 'open' && shift.status !== 'cancelled' && (
                                        <div className="text-amber-600 font-medium mt-2">
                                          ⚠️ This shift has applications or is in progress. Deletion may affect existing data.
                                        </div>
                                      )}
                                      {!shift.assignedTo && (shift.status === 'open' || shift.status === 'cancelled') && (
                                        <div className="text-gray-600 mt-2">
                                          This action cannot be undone.
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteShiftMutation.mutate(shift.id)}
                                      disabled={!!shift.assignedTo || deleteShiftMutation.isPending}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-testid={`confirm-delete-shift-${shift.id}`}
                                    >
                                      {deleteShiftMutation.isPending ? "Deleting..." : "Delete Shift"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No shifts found</p>
                      <p className="text-sm text-muted-foreground mt-2">Create your first shift to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === "manage-nurses" && <UserManagement />}
          
          {activeTab === "review-applications" && (
            <div className="space-y-6">
              {allShifts && Array.isArray(allShifts) && allShifts.length > 0 ? (
                <div className="space-y-6">
                  {allShifts.map((shift: ShiftWithDetails) => (
                    <ApplicationsReview key={shift.id} shift={shift} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No shifts found</p>
                    <p className="text-sm text-muted-foreground mt-2">Create shifts to start receiving applications from nurses</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}