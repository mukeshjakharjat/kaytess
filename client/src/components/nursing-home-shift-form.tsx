import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const nursingHomeShiftSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  shiftDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  priority: z.enum(["regular", "urgent", "emergency"]),
  careType: z.enum(["part-time", "long-term-care", "acute-care", "home-care"]),
  location: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

type NursingHomeShiftFormData = z.infer<typeof nursingHomeShiftSchema>;

interface NursingHomeShiftFormProps {
  onSuccess?: () => void;
}

export default function NursingHomeShiftForm({ onSuccess }: NursingHomeShiftFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NursingHomeShiftFormData>({
    resolver: zodResolver(nursingHomeShiftSchema),
    defaultValues: {
      departmentId: "",
      shiftDate: "",
      startTime: "",
      endTime: "",
      hourlyRate: "",
      priority: "regular",
      careType: "long-term-care",
      location: "",
      requirements: "",
      notes: "",
    },
  });

  // Get user's facility ID dynamically
  const { data: userFacility } = useQuery<{facilityId: number; facilityName: string}>({
    queryKey: [`/api/user-facility`],
    retry: false,
  });

  const getUserFacilityId = () => {
    return userFacility?.facilityId;
  };

  const facilityId = getUserFacilityId();

  // Load departments for the nursing home's facility
  const { data: departments } = useQuery({
    queryKey: [`/api/facilities/${facilityId}/departments`],
    retry: false,
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: NursingHomeShiftFormData) => {
      // Use the correct facility ID for this nursing home user
      const facilityId = getUserFacilityId();

      // Use the selected department from the form
      const departmentId = parseInt(data.departmentId);

      const payload = {
        facilityId: facilityId,
        departmentId: departmentId,
        shiftDate: data.shiftDate,
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyRate: data.hourlyRate,
        priority: data.priority,
        careType: data.careType,
        location: data.location || userFacility?.facilityName || "Healthcare Facility",
        address: (user as any)?.address || "",
        zipCode: (user as any)?.zipCode || "",
        requirements: data.requirements || null,
        notes: data.notes || null,
      };
      
      await apiRequest("POST", "/api/shifts", payload);
    },
    onSuccess: () => {
      toast({
        title: "Shift Posted",
        description: "Your shift has been posted successfully and is now available for nurses to apply.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shift-applications"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post shift",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NursingHomeShiftFormData) => {
    if (!userFacility?.facilityId) {
      toast({
        title: "Error",
        description: "Facility information not loaded. Please wait and try again.",
        variant: "destructive",
      });
      return;
    }
    createShiftMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post New Shift</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments && Array.isArray(departments) ? departments.filter(department => department.id && department.name).map((department: any) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shiftDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="careType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Care Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select care type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="long-term-care">Long-term Care</SelectItem>
                        <SelectItem value="acute-care">Acute Care</SelectItem>
                        <SelectItem value="home-care">Home Care</SelectItem>
                        <SelectItem value="part-time">Part-time Care</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="25.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={(user as any)?.facilityName || "Your facility name"}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Specify any special requirements or certifications needed..."
                      className="min-h-[80px]"
                      {...field} 
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information for nurses..."
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={createShiftMutation.isPending}
              className="w-full"
            >
              {createShiftMutation.isPending ? "Posting Shift..." : "Post Shift"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}