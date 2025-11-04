import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Stethoscope, Building, Info } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["nurse", "nursing_home"]),
  phoneNumber: z.string().optional(),
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
      facilityName: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserFormData) => {
      await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created successfully",
        description: "The new user account has been created. They can add verification details after logging in.",
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
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 dark:text-white">
            <UserPlus className="h-5 w-5" />
            <span>Create New User</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Role Selection */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="dark:text-gray-300">Account Type</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedRole(value as "nurse" | "nursing_home");
                        }} 
                        value={field.value}
                      >
                        <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-600 dark:border-gray-500">
                          <SelectItem value="nurse">
                            <div className="flex items-center space-x-2">
                              <Stethoscope className="h-4 w-4" />
                              <span>Nurse</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="nursing_home">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>Healthcare Center</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Basic Information */}
              <Card className="dark:bg-gray-700 dark:border-gray-600">
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
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Email Address</FormLabel>
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
                        <FormLabel className="dark:text-gray-300">Temporary Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-gray-300">Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRole === "nursing_home" && (
                    <FormField
                      control={form.control}
                      name="facilityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">Facility Name (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} className="dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Information Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-2 text-blue-800 dark:text-blue-200">
                  <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Verification Process</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This creates a basic account with login credentials. Users will add their 
                      {selectedRole === "nurse" ? " nursing credentials, certifications, and experience" : " facility details, licenses, and verification documents"} 
                      {" "}after logging in. You can review and verify these details in the Verification Center.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex-shrink-0 border-t dark:border-gray-600 pt-4">
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
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