import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, CreditCard, Send, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const paymentSchema = z.object({
  shiftId: z.number(),
  nurseId: z.string(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

type PaymentData = z.infer<typeof paymentSchema>;

interface PaymentManagementProps {
  userRole: "admin" | "nursing_home";
}

export default function PaymentManagement({ userRole }: PaymentManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const form = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      shiftId: 0,
      nurseId: "",
      amount: 0,
      notes: "",
    },
  });

  // Fetch completed shifts for payment
  const { data: completedShifts = [], isLoading } = useQuery({
    queryKey: ["/api/shifts", "completed"],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: "completed",
        ...(userRole === "nursing_home" && { createdBy: (user as any)?.id }),
      });
      const res = await apiRequest("GET", `/api/shifts?${params}`);
      return await res.json();
    },
  });

  // Fetch payment history
  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payments");
      return await res.json();
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      await apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Payment has been sent to admin for processing.",
      });
      setShowPaymentDialog(false);
      form.reset();
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

  const handlePayment = (shift: any) => {
    if (!shift.assignedNurse) {
      toast({
        title: "No Nurse Assigned",
        description: "This shift doesn't have an assigned nurse.",
        variant: "destructive",
      });
      return;
    }

    const hoursWorked = calculateHours(shift.startTime, shift.endTime);
    const totalAmount = hoursWorked * parseFloat(shift.hourlyRate);

    form.setValue("shiftId", shift.id);
    form.setValue("nurseId", shift.assignedNurse.id);
    form.setValue("amount", totalAmount);
    setSelectedShift(shift);
    setShowPaymentDialog(true);
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const onSubmit = (data: PaymentData) => {
    createPaymentMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedShifts.filter((shift: any) => !shift.isPaid).length}
            </div>
            <p className="text-xs text-muted-foreground">Shifts awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments.reduce((sum: number, payment: any) => sum + payment.amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedShifts.length > 0 
                ? ((payments.length / completedShifts.length) * 100).toFixed(0)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Completed Shifts Awaiting Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Shifts - Payment Required</CardTitle>
        </CardHeader>
        <CardContent>
          {completedShifts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Care Type</TableHead>
                  <TableHead>Nurse</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedShifts
                  .filter((shift: any) => !shift.isPaid)
                  .map((shift: any) => {
                    const hours = calculateHours(shift.startTime, shift.endTime);
                    const total = hours * parseFloat(shift.hourlyRate);
                    
                    return (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.shiftDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {shift.careType.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shift.assignedNurse ? 
                            `${shift.assignedNurse.firstName} ${shift.assignedNurse.lastName}` : 
                            "No nurse assigned"
                          }
                        </TableCell>
                        <TableCell>{hours.toFixed(1)}h</TableCell>
                        <TableCell>${shift.hourlyRate}/hr</TableCell>
                        <TableCell>${total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Awaiting Payment</Badge>
                        </TableCell>
                        <TableCell>
                          {userRole === "nursing_home" ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayment(shift)}
                              disabled={!shift.assignedNurse}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Pay
                            </Button>
                          ) : (
                            <Badge variant="outline">Admin Review</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No completed shifts requiring payment
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Nurse</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {payment.shift?.careType.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.nurse ? 
                        `${payment.nurse.firstName} ${payment.nurse.lastName}` : 
                        "Unknown"
                      }
                    </TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="default">Processed</Badge>
                    </TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No payment history available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {selectedShift && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <p><strong>Shift:</strong> {selectedShift.shiftDate}</p>
                  <p><strong>Nurse:</strong> {selectedShift.assignedNurse?.firstName} {selectedShift.assignedNurse?.lastName}</p>
                  <p><strong>Hours:</strong> {calculateHours(selectedShift.startTime, selectedShift.endTime).toFixed(1)}</p>
                  <p><strong>Rate:</strong> ${selectedShift.hourlyRate}/hr</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any payment notes..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPaymentDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? "Processing..." : "Send Payment to Admin"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}