import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  XCircle, 
  User, 
  FileText, 
  LogOut, 
  Bell 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NursingHomeShiftForm from "@/components/nursing-home-shift-form";
import ApplicationsReview from "@/components/applications-review";
import DepartmentManagement from "@/components/department-management";
import PaymentManagement from "@/components/payment-management";
import NursingHomeProfileNew from "@/components/nursing-home-profile-new";
import NursingHomeCredentialsIntegrated from "@/components/nursing-home-credentials-integrated";
import EnhancedNotificationSystem from "@/components/notification-system-enhanced";
import type { ShiftWithDetails, ShiftApplication } from "@shared/schema";

// Dynamic Department Management Component
function DynamicDepartmentManagement({ user }: { user: any }) {
  const { data: userFacility, isLoading } = useQuery<{facilityId: number; facilityName: string}>({
    queryKey: ["/api/user-facility"],
    retry: false,
  });

  if (isLoading || !userFacility) {
    return <div>Loading facility information...</div>;
  }

  return <DepartmentManagement facilityId={userFacility.facilityId} />;
}

export default function NursingHomeDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateShift, setShowCreateShift] = useState(false);

  // Fetch nursing home's shifts
  const { data: myShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["/api/shifts", "nursing-home"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/shifts?createdBy=${(user as any)?.id}`);
      return await res.json();
    },
  });

  // Fetch shift applications for nursing home's shifts
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/shift-applications", "nursing-home"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/shift-applications/nursing-home`);
      return await res.json();
    },
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { applicationId: number; status: string; notes?: string }) => {
      await apiRequest("PATCH", `/api/shift-applications/${applicationId}`, {
        status,
        adminNotes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-applications"] });
      toast({
        title: "Application Updated",
        description: "The application status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApplicationAction = (application: ShiftApplication, status: string, notes?: string) => {
    updateApplicationMutation.mutate({
      applicationId: application.id,
      status,
      notes,
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Calculate stats
  const totalShifts = myShifts.length;
  const openShifts = myShifts.filter((shift: ShiftWithDetails) => shift.status === "open").length;
  const filledShifts = myShifts.filter((shift: ShiftWithDetails) => shift.status === "filled").length;
  const pendingApplications = applications.filter((app: ShiftApplication) => app.status === "pending").length;

  // Mobile responsive tab handling
  const mobileTabConfig = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "applications", label: "Applications", icon: Users, badge: pendingApplications },
    { id: "shifts", label: "Shifts", icon: Calendar },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "profile", label: "Profile", icon: User },
    { id: "credentials", label: "Credentials", icon: FileText },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">KAYTESS</h1>
              <p className="text-sm text-muted-foreground">Nursing Home</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(user as any)?.id && <EnhancedNotificationSystem userId={(user as any).id} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Welcome Section */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Welcome back!</h2>
              <p className="text-muted-foreground">
                {(user as any)?.facilityName || `${(user as any)?.firstName} ${(user as any)?.lastName}`}
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateShift(true)}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post Shift
            </Button>
          </div>
        </div>

        {/* Mobile Stats Cards */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{totalShifts}</div>
            <div className="text-sm text-muted-foreground">Total Shifts</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{openShifts}</div>
            <div className="text-sm text-muted-foreground">Open Shifts</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{filledShifts}</div>
            <div className="text-sm text-muted-foreground">Filled Shifts</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{pendingApplications}</div>
            <div className="text-sm text-muted-foreground">Pending Apps</div>
          </Card>
        </div>

        {/* Mobile Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "overview" && (
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Applications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {applications.slice(0, 3).map((application: ShiftApplication) => (
                    <div key={application.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{(application as any).nurse?.firstName} {(application as any).nurse?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{(application as any).shift?.requirements || (application as any).shift?.department?.name || 'General Care'}</p>
                      </div>
                      <Badge variant={application.status === "pending" ? "secondary" : 
                                   application.status === "approved" ? "default" : "destructive"}>
                        {application.status}
                      </Badge>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No applications yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Shifts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {myShifts.slice(0, 3).map((shift: ShiftWithDetails) => (
                    <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{(shift as any).facility?.name || 'No facility name'}</p>
                        <p className="text-sm text-muted-foreground">
                          {shift.shiftDate} • ${shift.hourlyRate}/hr • {shift.requirements || shift.department?.name || 'General Care'}
                        </p>
                      </div>
                      <Badge variant={shift.status === "open" ? "secondary" : 
                                   shift.status === "filled" ? "default" : "outline"}>
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                  {myShifts.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No shifts posted yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.filter((app: ShiftApplication) => app.status === "pending").length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter((app: ShiftApplication) => app.status === "pending")
                        .map((application: ShiftApplication) => (
                          <ApplicationsReview
                            key={application.id}
                            shift={(application as any).shift}
                            onApplicationAction={handleApplicationAction}
                          />
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pending applications to review
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "shifts" && (
            <div className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Posted Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myShifts.map((shift: ShiftWithDetails) => (
                      <div key={shift.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{(shift as any).facility?.name || 'No facility name'}</h3>
                            <p className="text-sm text-muted-foreground">{shift.shiftDate} • {shift.requirements || shift.department?.name || 'General Care'}</p>
                          </div>
                          <Badge variant={shift.status === "open" ? "secondary" : 
                                       shift.status === "filled" ? "default" : "outline"}>
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Rate:</span> ${shift.hourlyRate}/hr</p>
                          <p><span className="font-medium">Time:</span> {shift.startTime} - {shift.endTime}</p>
                          <p><span className="font-medium">Priority:</span> {shift.priority}</p>
                        </div>
                      </div>
                    ))}
                    {myShifts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No shifts posted yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="p-4">
              <PaymentManagement userRole="nursing_home" />
            </div>
          )}

          {activeTab === "profile" && (
            <div className="p-4">
              <NursingHomeProfileNew user={user as any} />
            </div>
          )}

          {activeTab === "credentials" && (
            <div className="p-4">
              <NursingHomeCredentialsIntegrated user={user as any} />
            </div>
          )}

          {activeTab === "departments" && (
            <div className="p-4">
              <DepartmentManagement facilityId={5} />
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="border-t bg-card p-3">
          <div className="grid grid-cols-3 gap-2">
            {mobileTabConfig.slice(0, 6).map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="lg"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex flex-col items-center gap-2 h-auto py-4 px-3 min-h-[60px] touch-manipulation"
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {tab.badge && tab.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between p-6 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">KAYTESS Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {(user as any)?.facilityName || `${(user as any)?.firstName} ${(user as any)?.lastName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(user as any)?.id && <EnhancedNotificationSystem userId={(user as any).id} />}
            <Button 
              onClick={() => setShowCreateShift(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post New Shift
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Desktop Stats Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">All time shifts posted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Shifts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openShifts}</div>
              <p className="text-xs text-muted-foreground">Awaiting nurses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filled Shifts</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filledShifts}</div>
              <p className="text-xs text-muted-foreground">Successfully staffed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Main Content Tabs */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications ({pendingApplications})</TabsTrigger>
              <TabsTrigger value="shifts">My Shifts</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.slice(0, 5).map((application: ShiftApplication) => (
                      <div key={application.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{(application as any).nurse?.firstName} {(application as any).nurse?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{(application as any).shift?.requirements || (application as any).shift?.department?.name || 'General Care'}</p>
                        </div>
                        <Badge variant={application.status === "pending" ? "secondary" : 
                                     application.status === "approved" ? "default" : "destructive"}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No applications yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Shifts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myShifts.slice(0, 5).map((shift: ShiftWithDetails) => (
                      <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{(shift as any).facility?.name || 'No facility name'}</p>
                          <p className="text-sm text-muted-foreground">
                            {shift.shiftDate} • ${shift.hourlyRate}/hr
                          </p>
                        </div>
                        <Badge variant={shift.status === "open" ? "secondary" : 
                                     shift.status === "filled" ? "default" : "outline"}>
                          {shift.status}
                        </Badge>
                      </div>
                    ))}
                    {myShifts.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No shifts posted yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.filter((app: ShiftApplication) => app.status === "pending").length > 0 ? (
                    <div className="space-y-4">
                      {applications
                        .filter((app: ShiftApplication) => app.status === "pending")
                        .map((application: ShiftApplication) => (
                          <ApplicationsReview
                            key={application.id}
                            shift={(application as any).shift}
                            onApplicationAction={handleApplicationAction}
                          />
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No pending applications to review
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shifts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Posted Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {myShifts.map((shift: ShiftWithDetails) => (
                      <div key={shift.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{(shift as any).facility?.name || 'No facility name'}</h3>
                            <p className="text-sm text-muted-foreground">{shift.shiftDate}</p>
                          </div>
                          <Badge variant={shift.status === "open" ? "secondary" : 
                                       shift.status === "filled" ? "default" : "outline"}>
                            {shift.status}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Rate:</span> ${shift.hourlyRate}/hr</p>
                          <p><span className="font-medium">Time:</span> {shift.startTime} - {shift.endTime}</p>
                          <p><span className="font-medium">Priority:</span> {shift.priority}</p>
                        </div>
                      </div>
                    ))}
                    {myShifts.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No shifts posted yet. Click "Post New Shift" to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <PaymentManagement userRole="nursing_home" />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <NursingHomeProfileNew user={user as any} />
            </TabsContent>

            <TabsContent value="credentials" className="space-y-4">
              <NursingHomeCredentialsIntegrated user={user as any} />
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <DynamicDepartmentManagement user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Shift Modal */}
      {showCreateShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Post New Shift</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateShift(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <NursingHomeShiftForm onSuccess={() => setShowCreateShift(false)} />
          </div>
        </div>
      )}
      
      {/* Enhanced Notification System for Browser Push Notifications */}
      {user?.id && <EnhancedNotificationSystem userId={user.id} />}
    </div>
  );
}