import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, DollarSign, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShiftWithDetails, Payment } from "@shared/schema";

interface RunningShiftsProps {
  userId: string;
}

export default function RunningShifts({ userId }: RunningShiftsProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch nurse's assigned shifts (only truly active ones)
  const { data: runningShifts = [], isLoading } = useQuery({
    queryKey: ['/api/shifts/nurse', userId, 'running'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts/nurse/${userId}?status=in_progress`);
      return response.json();
    },
  });

  // Fetch shifts ready to start (filled but not started)
  const { data: readyShifts = [] } = useQuery({
    queryKey: ['/api/shifts/nurse', userId, 'ready'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts/nurse/${userId}?status=filled`);
      return response.json();
    },
  });

  // Fetch completed shifts
  const { data: completedShifts = [] } = useQuery({
    queryKey: ['/api/shifts/nurse', userId, 'completed'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/shifts/nurse/${userId}?status=completed`);
      return response.json();
    },
  });

  // Fetch payments for shifts
  const { data: payments = [] } = useQuery({
    queryKey: ['/api/payments/nurse', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/payments/nurse/${userId}`);
      return response.json();
    },
  });

  // Start shift mutation
  const startShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const response = await apiRequest('POST', `/api/shifts/${shiftId}/start`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/nurse'] });
      toast({
        title: "Shift Started",
        description: "Your shift timer has been started. Good luck!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // End shift mutation
  const endShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const response = await apiRequest('POST', `/api/shifts/${shiftId}/end`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/nurse'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/nurse'] });
      toast({
        title: "Shift Completed",
        description: "Your shift has been completed and payment is being processed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateHoursWorked = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(0, diffMs / (1000 * 60 * 60));
    return hours.toFixed(1);
  };

  const calculateEarnings = (hoursWorked: number, hourlyRate: number) => {
    return (hoursWorked * hourlyRate).toFixed(2);
  };

  const getPaymentStatus = (shiftId: number) => {
    const payment = payments.find((p: Payment) => p.shiftId === shiftId);
    if (!payment) return 'Not Created';
    
    if (payment.adminToNurseStatus === 'completed') return 'Paid';
    if (payment.nursingHomeToAdminStatus === 'completed') return 'Approved - Pending Payment';
    if (payment.nursingHomeToAdminStatus === 'processing') return 'Processing';
    return 'Pending Healthcare Center Payment';
  };

  const getPaymentAmount = (shiftId: number) => {
    const payment = payments.find((p: Payment) => p.shiftId === shiftId);
    return payment ? parseFloat(payment.nurseAmount) : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currently Running Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-500" />
            Currently Running ({runningShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runningShifts.length > 0 ? (
            <div className="space-y-4">
              {runningShifts.map((shift: ShiftWithDetails) => {
                const hoursWorked = shift.actualStartTime 
                  ? parseFloat(calculateHoursWorked(shift.actualStartTime))
                  : 0;
                const expectedEarnings = calculateEarnings(hoursWorked, parseFloat(shift.hourlyRate));
                
                return (
                  <Card key={shift.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{shift.facility.name}</h3>
                            <Badge variant={shift.status === 'in_progress' ? 'default' : 'secondary'}>
                              {shift.status === 'in_progress' ? 'In Progress' : 'Ready to Start'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {shift.department.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {shift.shiftDate} • {shift.startTime} - {shift.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${shift.hourlyRate}/hour
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Hours worked: {hoursWorked}h
                            </div>
                          </div>
                          
                          {shift.requirements && (
                            <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <strong>Requirements:</strong> {shift.requirements}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-48">
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${expectedEarnings}
                            </div>
                            <div className="text-xs text-muted-foreground">Expected Earnings</div>
                          </div>
                          
                          <div className="flex gap-2">
                            {shift.status === 'filled' && !shift.actualStartTime && (
                              <Button
                                onClick={() => startShiftMutation.mutate(shift.id)}
                                disabled={startShiftMutation.isPending}
                                className="flex-1"
                                size="sm"
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start Shift
                              </Button>
                            )}
                            
                            {shift.status === 'in_progress' && shift.actualStartTime && (
                              <Button
                                onClick={() => endShiftMutation.mutate(shift.id)}
                                disabled={endShiftMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                                size="sm"
                              >
                                <Square className="h-4 w-4 mr-1" />
                                End Shift
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Active Shifts</h3>
              <p className="text-sm">Your accepted shifts will appear here when it's time to start.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready to Start Shifts */}
      {readyShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Ready to Start ({readyShifts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {readyShifts.map((shift: ShiftWithDetails) => {
                const hoursWorked = 0; // Not started yet
                const expectedEarnings = calculateEarnings(parseFloat(shift.endTime.replace(':', '.')) - parseFloat(shift.startTime.replace(':', '.')), parseFloat(shift.hourlyRate));
                
                return (
                  <Card key={shift.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{shift.facility.name}</h3>
                            <Badge variant="secondary">Ready to Start</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {shift.department.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {shift.shiftDate} • {shift.startTime} - {shift.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${shift.hourlyRate}/hour
                            </div>
                          </div>
                          
                          {shift.requirements && (
                            <p className="text-sm mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <strong>Requirements:</strong> {shift.requirements}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-48">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${expectedEarnings}
                            </div>
                            <div className="text-xs text-muted-foreground">Expected Earnings</div>
                          </div>
                          
                          <Button
                            onClick={() => startShiftMutation.mutate(shift.id)}
                            disabled={startShiftMutation.isPending}
                            className="w-full"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start Shift
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Completed Shifts ({completedShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedShifts.length > 0 ? (
            <div className="space-y-4">
              {completedShifts.map((shift: ShiftWithDetails) => {
                const hoursWorked = shift.totalHoursWorked 
                  ? parseFloat(shift.totalHoursWorked)
                  : 0;
                const totalEarnings = calculateEarnings(hoursWorked, parseFloat(shift.hourlyRate));
                const paymentStatus = getPaymentStatus(shift.id);
                const paymentAmount = getPaymentAmount(shift.id);
                
                return (
                  <Card key={shift.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{shift.facility.name}</h3>
                            <Badge variant="outline">Completed</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {shift.department.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {shift.shiftDate}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {hoursWorked}h worked
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${shift.hourlyRate}/hour
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-48">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              ${totalEarnings}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Earned</div>
                          </div>
                          
                          <Badge 
                            variant={paymentStatus === 'Paid' ? 'default' : 'secondary'}
                            className="text-center"
                          >
                            {paymentStatus}
                          </Badge>
                          
                          {paymentAmount > 0 && paymentStatus === 'Paid' && (
                            <div className="text-center text-sm text-green-600 dark:text-green-400">
                              Received: ${paymentAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Completed Shifts</h3>
              <p className="text-sm">Your completed shifts and payment history will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}