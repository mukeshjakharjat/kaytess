import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Facility, Department } from "@shared/schema";

const createShiftSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  departmentId: z.string().min(1, "Department is required"),
  shiftDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  priority: z.enum(["regular", "urgent", "emergency"]),
  careType: z.enum(["part-time", "long-term-care", "acute-care", "home-care"]),
  location: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  requirements: z.string().optional(),
});

type CreateShiftFormData = z.infer<typeof createShiftSchema>;

interface CreateShiftFormProps {
  onSuccess?: () => void;
}

export default function CreateShiftForm({ onSuccess }: CreateShiftFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  const form = useForm<CreateShiftFormData>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: {
      facilityId: "",
      departmentId: "",
      shiftDate: "",
      startTime: "",
      endTime: "",
      hourlyRate: "",
      priority: "regular",
      careType: "part-time",
      location: "",
      address: "",
      zipCode: "",
      requirements: "",
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ["/api/facilities"],
    retry: false,
  });

  const { data: departments } = useQuery({
    queryKey: [`/api/facilities/${selectedFacilityId}/departments`],
    retry: false,
    enabled: !!selectedFacilityId,
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: CreateShiftFormData) => {
      const payload = {
        facilityId: parseInt(data.facilityId),
        departmentId: parseInt(data.departmentId),
        shiftDate: data.shiftDate,
        startTime: data.startTime,
        endTime: data.endTime,
        hourlyRate: data.hourlyRate,
        priority: data.priority,
        careType: data.careType,
        location: data.location || null,
        address: data.address || null,
        zipCode: data.zipCode || null,
        requirements: data.requirements || null,
      };
      await apiRequest("POST", "/api/shifts", payload);
    },
    onSuccess: () => {
      toast({
        title: "Shift Created",
        description: "The shift has been created successfully!",
      });
      form.reset();
      setSelectedFacilityId("");
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      onSuccess?.();
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
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateShiftFormData) => {
    createShiftMutation.mutate(data);
  };

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    form.setValue("facilityId", facilityId);
    form.setValue("departmentId", ""); // Reset department when facility changes
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility</FormLabel>
                    <Select 
                      onValueChange={handleFacilityChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilities && Array.isArray(facilities) ? facilities.filter(facility => facility.id && facility.name).map((facility: any) => (
                          <SelectItem key={facility.id} value={facility.id.toString()}>
                            {facility.name}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shiftDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="45.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            {/* Care Type and Location Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="careType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Care Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select care type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="long-term-care">Long-term Care</SelectItem>
                        <SelectItem value="acute-care">Acute Care</SelectItem>
                        <SelectItem value="home-care">Home Care</SelectItem>
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
                    <FormLabel>Location Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Downtown Medical Center"
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main Street, City, State"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="12345"
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
                  <FormLabel>Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Any specific requirements for this shift..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                disabled={createShiftMutation.isPending}
                className="bg-medical-blue hover:bg-blue-700"
              >
                {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
