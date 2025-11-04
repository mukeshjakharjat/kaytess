import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AdminUserDetailsModal from "@/components/admin-user-details-modal";
import AdminCreateUserModal from "@/components/admin-create-user-modal-simple";
import NotificationTester from "@/components/notification-tester";
import EnhancedNotificationSystem from "@/components/notification-system-enhanced";
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  ClipboardList, 
  Shield, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  UserCheck,
  Moon,
  Sun,
  Menu,
  X,
  Search,
  Filter,
  Eye,
  Stethoscope,
  Home as HomeIcon,
  UserPlus,
  Bell,
  TestTube,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, ShiftWithDetails } from "@shared/schema";

// Remove interface and use User type directly

export default function AdminDashboardMobile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-dark-mode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Dark mode toggle
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('admin-dark-mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('admin-dark-mode', 'false');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.clear();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out.",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect if not admin
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

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  const { data: shifts } = useQuery({
    queryKey: ["/api/shifts"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

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
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete shift. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["/api/payments"],
    enabled: isAuthenticated && (user as any)?.role === 'admin',
  });

  // Update user verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        credentialsVerificationStatus: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Verification status updated",
        description: "User verification status has been changed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update verification status.",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search and filters
  const filteredUsers = Array.isArray(allUsers) ? (allUsers as User[]).filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.facilityName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.credentialsVerificationStatus === statusFilter;
    const matchesType = userTypeFilter === "all" || user.role === userTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500 dark:bg-green-600';
      case 'pending': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'rejected': return 'bg-red-500 dark:bg-red-600';
      default: return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="text-gray-600 dark:text-gray-300"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-2 p-4">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("overview");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === "verification" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("verification");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <Shield className="h-4 w-4 mr-2" />
                Verification
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("users");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button
                variant={activeTab === "shifts" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("shifts");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Shifts
              </Button>
              <Button
                variant={activeTab === "payments" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("payments");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Payments
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveTab("notifications");
                  setIsMobileMenuOpen(false);
                }}
                className="justify-start h-12"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 shadow-lg">
          <div className="flex items-center h-16 px-6 border-b dark:border-gray-700">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">KAYTESS Admin</span>
          </div>
          
          <nav className="mt-6 flex-1">
            <div className="px-3 space-y-1">
              <Button
                variant={activeTab === "overview" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("overview")}
                className="w-full justify-start h-12"
              >
                <TrendingUp className="h-5 w-5 mr-3" />
                Overview
              </Button>
              <Button
                variant={activeTab === "verification" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("verification")}
                className="w-full justify-start h-12"
              >
                <Shield className="h-5 w-5 mr-3" />
                Verification Center
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("users")}
                className="w-full justify-start h-12"
              >
                <Users className="h-5 w-5 mr-3" />
                User Management
              </Button>
              <Button
                variant={activeTab === "shifts" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("shifts")}
                className="w-full justify-start h-12"
              >
                <Calendar className="h-5 w-5 mr-3" />
                Shift Management
              </Button>
              <Button
                variant={activeTab === "payments" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("payments")}
                className="w-full justify-start h-12"
              >
                <TrendingUp className="h-5 w-5 mr-3" />
                Payment Management
              </Button>
              <Button
                variant={activeTab === "notifications" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("notifications")}
                className="w-full justify-start h-12"
              >
                <Bell className="h-5 w-5 mr-3" />
                Notifications
              </Button>
            </div>
          </nav>

          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="text-gray-600 dark:text-gray-300"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="hidden lg:block">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Monitor and manage your healthcare staffing platform</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(allUsers) ? allUsers.length : 0}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Registered accounts</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Open Shifts</CardTitle>
                      <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.openShifts || 0}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Available positions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Filled Shifts</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as any)?.filledShifts || 0}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assigned positions</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending Reviews</CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {filteredUsers.filter(u => u.credentialsVerificationStatus === 'pending').length}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Awaiting verification</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Recent Shifts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      {shifts && Array.isArray(shifts) && shifts.length > 0 ? (
                        <div className="space-y-3">
                          {shifts.slice(0, 5).map((shift: ShiftWithDetails) => (
                            <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">{shift.facility?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{shift.department?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(shift.shiftDate).toLocaleDateString()} • ${shift.hourlyRate}/hr
                                </p>
                              </div>
                              <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                                {shift.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No shifts available</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Verification Center Tab */}
            {activeTab === "verification" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Center</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Review and approve nurse and healthcare facility credentials</p>
                </div>

                {/* Search and Filters */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by name, email, or facility..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40 dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                        <SelectTrigger className="w-full sm:w-40 dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="nurse">Nurses</SelectItem>
                          <SelectItem value="nursing_home">Healthcare Centers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification List */}
                <div className="space-y-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((verifyUser: User) => (
                      <Card key={verifyUser.id} className="dark:bg-gray-800 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start space-x-4">
                              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                verifyUser.role === 'nurse' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                              }`}>
                                {verifyUser.role === 'nurse' ? 
                                  <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" /> :
                                  <Building className="h-6 w-6 text-green-600 dark:text-green-400" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {verifyUser.firstName} {verifyUser.lastName}
                                  </h3>
                                  <Badge 
                                    variant="secondary" 
                                    className={`${getStatusColor(verifyUser.credentialsVerificationStatus || 'pending')} text-white`}
                                  >
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(verifyUser.credentialsVerificationStatus || 'pending')}
                                      <span className="capitalize">{verifyUser.credentialsVerificationStatus || 'pending'}</span>
                                    </div>
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{verifyUser.email}</p>
                                {verifyUser.role === 'nurse' && verifyUser.licenseNumber && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">License: {verifyUser.licenseNumber}</p>
                                )}
                                {verifyUser.role === 'nursing_home' && verifyUser.facilityName && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Facility: {verifyUser.facilityName}</p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  Registered: {verifyUser.createdAt ? new Date(verifyUser.createdAt).toLocaleDateString() : 'Unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(verifyUser);
                                  setIsUserDetailsOpen(true);
                                }}
                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {verifyUser.credentialsVerificationStatus === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateVerificationMutation.mutate({ userId: verifyUser.id, status: 'verified' })}
                                    disabled={updateVerificationMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateVerificationMutation.mutate({ userId: verifyUser.id, status: 'rejected' })}
                                    disabled={updateVerificationMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardContent className="p-8 text-center">
                        <Shield className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Manage all registered users and create new accounts</p>
                  </div>
                  <Button
                    onClick={() => setIsCreateUserOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </div>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700">
                            <TableHead className="dark:text-gray-300">Name</TableHead>
                            <TableHead className="dark:text-gray-300">Email</TableHead>
                            <TableHead className="dark:text-gray-300">Role</TableHead>
                            <TableHead className="dark:text-gray-300">Status</TableHead>
                            <TableHead className="dark:text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(allUsers) ? allUsers.map((userItem: User) => (
                            <TableRow key={userItem.id} className="dark:border-gray-700">
                              <TableCell className="font-medium dark:text-white">
                                {userItem.firstName} {userItem.lastName}
                              </TableCell>
                              <TableCell className="dark:text-gray-300">{userItem.email}</TableCell>
                              <TableCell className="dark:text-gray-300">
                                <Badge variant="outline" className="capitalize dark:border-gray-600 dark:text-gray-300">
                                  {userItem.role?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="secondary" 
                                  className={`${getStatusColor(userItem.credentialsVerificationStatus || 'pending')} text-white`}
                                >
                                  {userItem.credentialsVerificationStatus || 'pending'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedUser(userItem);
                                    setIsUserDetailsOpen(true);
                                  }}
                                  className="dark:border-gray-600 dark:text-gray-300"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No users found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Shifts Tab */}
            {activeTab === "shifts" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shift Management</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Monitor and manage all shifts</p>
                </div>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700">
                            <TableHead className="dark:text-gray-300">Facility</TableHead>
                            <TableHead className="dark:text-gray-300">Department</TableHead>
                            <TableHead className="dark:text-gray-300">Date</TableHead>
                            <TableHead className="dark:text-gray-300">Rate</TableHead>
                            <TableHead className="dark:text-gray-300">Status</TableHead>
                            <TableHead className="dark:text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(shifts) ? (shifts as ShiftWithDetails[]).map((shift) => (
                            <TableRow key={shift.id} className="dark:border-gray-700">
                              <TableCell className="font-medium dark:text-white">{shift.facility?.name}</TableCell>
                              <TableCell className="dark:text-gray-300">{shift.department?.name}</TableCell>
                              <TableCell className="dark:text-gray-300">
                                {new Date(shift.shiftDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="dark:text-gray-300">${shift.hourlyRate}/hr</TableCell>
                              <TableCell>
                                <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                                  {shift.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                      disabled={!!shift.assignedTo}
                                      data-testid={`delete-shift-${shift.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 dark:text-white">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Delete Shift
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="dark:text-gray-300">
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
                                          <div className="text-gray-600 dark:text-gray-400 mt-2">
                                            This action cannot be undone.
                                          </div>
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteShiftMutation.mutate(shift.id)}
                                        disabled={!!shift.assignedTo || deleteShiftMutation.isPending}
                                        className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                                        data-testid={`confirm-delete-shift-${shift.id}`}
                                      >
                                        {deleteShiftMutation.isPending ? "Deleting..." : "Delete Shift"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No shifts found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Track healthcare center payments and nurse distributions</p>
                </div>

                {/* Payment Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Due from Healthcare Centers</CardTitle>
                      <Building className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${payments && Array.isArray(payments) ? 
                          payments.filter(p => p.status === 'pending' && p.nursingHomePaidAt)
                                 .reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) : '0.00'
                        }
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending collections</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Due to Nurses</CardTitle>
                      <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${payments && Array.isArray(payments) ? 
                          payments.filter(p => p.status === 'approved' && !p.nursePaidAt)
                                 .reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) : '0.00'
                        }
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ready for distribution</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Processed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${payments && Array.isArray(payments) ? 
                          payments.filter(p => p.status === 'completed')
                                 .reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2) : '0.00'
                        }
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Successfully distributed</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payments from Healthcare Centers */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Payments from Healthcare Centers</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amounts received from healthcare facilities</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700">
                            <TableHead className="dark:text-gray-300">Healthcare Center</TableHead>
                            <TableHead className="dark:text-gray-300">Shift ID</TableHead>
                            <TableHead className="dark:text-gray-300">Amount</TableHead>
                            <TableHead className="dark:text-gray-300">Status</TableHead>
                            <TableHead className="dark:text-gray-300">Date Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments && Array.isArray(payments) && payments.filter(p => p.nursingHomePaidAt).length > 0 ? (
                            payments.filter(p => p.nursingHomePaidAt).map((payment) => (
                              <TableRow key={payment.id} className="dark:border-gray-700">
                                <TableCell className="font-medium dark:text-white">
                                  {(allUsers as User[])?.find((u: User) => u.id === payment.nursingHomeId)?.facilityName || 'Unknown Facility'}
                                </TableCell>
                                <TableCell className="dark:text-gray-300">#{payment.shiftId}</TableCell>
                                <TableCell className="dark:text-gray-300 font-mono">${payment.amount}</TableCell>
                                <TableCell>
                                  <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="dark:text-gray-300">
                                  {payment.nursingHomePaidAt ? new Date(payment.nursingHomePaidAt).toLocaleDateString() : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No payments from healthcare centers yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Payments to Nurses */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Payments to Nurses</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distribution tracking for nurse payments</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700">
                            <TableHead className="dark:text-gray-300">Nurse Name</TableHead>
                            <TableHead className="dark:text-gray-300">Shift ID</TableHead>
                            <TableHead className="dark:text-gray-300">Amount Due</TableHead>
                            <TableHead className="dark:text-gray-300">Status</TableHead>
                            <TableHead className="dark:text-gray-300">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts && Array.isArray(shifts) && shifts.filter(s => s.status === 'filled').length > 0 ? (
                            shifts.filter(s => s.status === 'filled').map((shift: ShiftWithDetails) => {
                              const nursePayment = Array.isArray(payments) ? payments.find((p: any) => p.shiftId === shift.id && p.nurseId) : null;
                              const nurseName = shift.assignedNurse ? 
                                `${shift.assignedNurse.firstName || ''} ${shift.assignedNurse.lastName || ''}`.trim() ||
                                shift.assignedNurse.email : 'Unknown Nurse';
                              
                              return (
                                <TableRow key={shift.id} className="dark:border-gray-700">
                                  <TableCell className="font-medium dark:text-white">{nurseName}</TableCell>
                                  <TableCell className="dark:text-gray-300">#{shift.id}</TableCell>
                                  <TableCell className="dark:text-gray-300 font-mono">
                                    ${(shift.hourlyRate * 8).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={nursePayment?.status === 'completed' ? 'default' : 'secondary'}>
                                      {nursePayment?.status || 'pending'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {!nursePayment?.nursePaidAt && (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-8 text-xs dark:border-gray-600 dark:text-gray-300"
                                      >
                                        Pay Nurse
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No completed shifts requiring payment
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="hidden lg:block">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Push Notifications</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Test and manage push notifications for all task activities</p>
                </div>

                <div className="grid gap-6">
                  {/* Enhanced Notification System */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 dark:text-white">
                        <Bell className="h-5 w-5" />
                        <span>Notification Center</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EnhancedNotificationSystem userId={user?.id || ""} />
                    </CardContent>
                  </Card>

                  {/* Notification Tester */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 dark:text-white">
                        <TestTube className="h-5 w-5" />
                        <span>Push Notification Tester</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Test push notifications for all task activities including shift applications, payments, and verification updates.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <NotificationTester 
                        userId={user?.id || ""} 
                        userRole={user?.role || "admin"} 
                      />
                    </CardContent>
                  </Card>

                  {/* Notification Types Documentation */}
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Supported Notification Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="p-4 border rounded-lg dark:border-gray-600">
                          <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Shift Notifications</h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• New shift posted</li>
                            <li>• Shift application submitted</li>
                            <li>• Application approved/rejected</li>
                            <li>• Shift assignment updates</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border rounded-lg dark:border-gray-600">
                          <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Payment Notifications</h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Payment received</li>
                            <li>• Payment processing</li>
                            <li>• Payment completed</li>
                            <li>• Payment reminders</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 border rounded-lg dark:border-gray-600">
                          <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Verification Notifications</h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Credentials submitted</li>
                            <li>• Verification approved</li>
                            <li>• Verification rejected</li>
                            <li>• Document updates required</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdminUserDetailsModal 
        user={selectedUser}
        isOpen={isUserDetailsOpen}
        onClose={() => {
          setIsUserDetailsOpen(false);
          setSelectedUser(null);
        }}
      />
      
      <AdminCreateUserModal 
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
      />
    </div>
  );
}