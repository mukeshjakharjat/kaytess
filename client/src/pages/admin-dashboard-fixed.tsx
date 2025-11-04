import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import UserManagement from "@/components/user-management";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, DollarSign, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User, Payment, ShiftWithDetails } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

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

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user as any)?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch admin statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  // Fetch all users for management
  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  // Fetch all shifts for overview
  const { data: allShifts = [] } = useQuery({
    queryKey: ["/api/shifts"],
    enabled: !!user && (user as any)?.role === 'admin',
  });

  // Fetch pending payments
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ["/api/payments", "pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments?status=pending");
      return await res.json();
    },
    enabled: !!user && (user as any)?.role === 'admin',
  });

  // Approve payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest("PATCH", `/api/payments/${paymentId}`, {
        status: "approved",
        adminApprovedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Approved",
        description: "Payment has been approved and will be processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pay nurse mutation
  const payNurseMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest("PATCH", `/api/payments/${paymentId}`, {
        status: "paid",
        nursePaidAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Completed",
        description: "Nurse has been paid successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  const nursingHomes = (allUsers as User[]).filter((u: User) => u.role === 'nursing_home');
  const nurses = (allUsers as User[]).filter((u: User) => u.role === 'nurse');
  const totalRevenue = (pendingPayments as Payment[]).reduce((sum: number, payment: Payment) => 
    sum + parseFloat(payment.amount as string), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(allUsers as User[]).length}</div>
              <p className="text-xs text-muted-foreground">
                {nurses.length} nurses, {nursingHomes.length} nursing homes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(allShifts as ShiftWithDetails[]).length}</div>
              <p className="text-xs text-muted-foreground">
                {(stats as any)?.openShifts || 0} open, {(stats as any)?.filledShifts || 0} filled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                ${totalRevenue.toFixed(2)} total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue * 0.1).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">10% platform fee</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Shifts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(allShifts as ShiftWithDetails[]).slice(0, 5).map((shift: ShiftWithDetails) => (
                      <div key={shift.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shift.careType?.replace('-', ' ') || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {shift.facility?.name || 'Unknown'} - {shift.shiftDate}
                          </p>
                        </div>
                        <Badge variant={shift.status === "open" ? "secondary" : "default"}>
                          {shift.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(allUsers as User[]).slice(-5).map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Management</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Nursing Home</TableHead>
                        <TableHead>Nurse</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingPayments.map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.createdAt!).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {(payment as any).nursingHome?.firstName} {(payment as any).nursingHome?.lastName}
                          </TableCell>
                          <TableCell>
                            {(payment as any).nurse?.firstName} {(payment as any).nurse?.lastName}
                          </TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant={
                              payment.status === "pending" ? "secondary" :
                              payment.status === "approved" ? "default" : "outline"
                            }>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {payment.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => approvePaymentMutation.mutate(payment.id)}
                                  disabled={approvePaymentMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              )}
                              {payment.status === "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => payNurseMutation.mutate(payment.id)}
                                  disabled={payNurseMutation.isPending}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Pay Nurse
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pending payments
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}