import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Stethoscope, Building } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["nurse", "nursing_home"]),
  phoneNumber: z.string().optional(),
  
  // Basic facility name for nursing homes only
  facilityName: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface AdminCreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCreateUserModal({ isOpen, onClose }: AdminCreateUserModalProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"nurse" | "nursing_home">("nurse");

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "nurse",
      phoneNumber: "",
      licenseNumber: "",
      licenseType: "",
      specialties: "",
      yearsOfExperience: undefined,
      facilityName: "",
      facilityType: "",
      facilityLicenseNumber: "",
      capacity: undefined,
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const userData = { ...data };
      
      // Convert specialties string to array for nurses
      if (userData.role === 'nurse' && userData.specialties) {
        (userData as any).specialties = userData.specialties.split(',').map(s => s.trim());
      }
      
      await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created successfully",
        description: "The new user account has been created and can now log in.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create user",
        description: error.message || "An error occurred while creating the user.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 dark:text-white">
            <UserPlus className="h-5 w-5" />
            <span>Create New User</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs 
              value={selectedRole} 
              onValueChange={(value) => {
                setSelectedRole(value as "nurse" | "nursing_home");
                form.setValue("role", value as "nurse" | "nursing_home");
              }}
            >
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="nurse" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Nurse
                </TabsTrigger>
                <TabsTrigger value="nursing_home" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Building className="h-4 w-4 mr-2" />
                  Healthcare Center
                </TabsTrigger>
              </TabsList>

              {/* Basic Information - Same for both roles */}
              <Card className="mt-4 dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">First Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <TabsContent value="nurse">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                    <Stethoscope className="h-5 w-5" />
                    <h3 className="font-medium">Nurse Account</h3>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Creating a basic nurse account. The user will add their nursing credentials, certifications, and experience after logging in. Admin can review and verify these details in the Verification Center.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="nursing_home">
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white">Facility Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facilityName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">Facility Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="facilityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">Facility Type</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500">
                                  <SelectValue placeholder="Select facility type" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-600 dark:border-gray-500">
                                  <SelectItem value="hospital">Hospital</SelectItem>
                                  <SelectItem value="nursing_home">Nursing Home</SelectItem>
                                  <SelectItem value="assisted_living">Assisted Living</SelectItem>
                                  <SelectItem value="rehabilitation">Rehabilitation Center</SelectItem>
                                  <SelectItem value="clinic">Clinic</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facilityLicenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">Facility License Number</FormLabel>
                            <FormControl>
                              <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">Capacity (beds)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Address</FormLabel>
                          <FormControl>
                            <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">City</FormLabel>
                            <FormControl>
                              <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-gray-300">State</FormLabel>
                            <FormControl>
                              <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
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
                            <FormLabel className="dark:text-gray-300">ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}