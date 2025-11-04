import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Phone, Mail, MapPin, Building, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

// Individual section schemas
const accountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

const facilitySchema = z.object({
  facilityName: z.string().min(1, "Facility name is required"),
  facilityType: z.string().min(1, "Facility type is required"),
  capacity: z.number().min(1, "Capacity is required"),
  facilityLicenseNumber: z.string().optional(),
  licenseType: z.string().optional(),
  establishedYear: z.number().min(1900, "Established year must be valid").optional(),
});

const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
  facilityPhone: z.string().optional(),
  facilityEmail: z.string().email("Invalid facility email").optional(),
  website: z.string().optional(),
});

const servicesSchema = z.object({
  servicesOffered: z.string().optional(),
  accreditation: z.array(z.string()).optional(),
  medicareCertified: z.boolean().optional(),
  medicaidCertified: z.boolean().optional(),
});

const aboutSchema = z.object({
  description: z.string().optional(),
  adminName: z.string().optional(),
  adminTitle: z.string().optional(),
  emergencyContact: z.string().optional(),
});

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const FACILITY_TYPES = [
  "Skilled Nursing Facility",
  "Assisted Living",
  "Memory Care",
  "Rehabilitation Center",
  "Long-term Care",
  "Independent Living",
  "Continuing Care Retirement Community"
];

interface ProfileSectionProps {
  user: User;
  isAdmin?: boolean;
}

function AccountSection({ user, isAdmin = false }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accountSchema>) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Account Updated",
        description: "Your account information has been updated successfully!",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof accountSchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>Account Settings</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle>Account Settings</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {user.phoneNumber || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FacilitySection({ user, isAdmin = false }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      facilityName: user.facilityName || "",
      facilityType: user.facilityType || "",
      capacity: user.capacity || 0,
      facilityLicenseNumber: user.facilityLicenseNumber || "",
      licenseType: user.licenseType || "",
      establishedYear: user.establishedYear || new Date().getFullYear(),
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof facilitySchema>) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Facility Information Updated",
        description: "Your facility information has been updated successfully!",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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
        description: error.message || "Failed to update facility information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof facilitySchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-blue-600" />
            <CardTitle>Facility Information</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facilityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Facility Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FACILITY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licensedBeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Licensed Beds</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentResidents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Residents</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicareProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicare Provider Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicaidProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicaid Provider Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Facility Info"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building className="h-5 w-5 text-blue-600" />
          <CardTitle>Facility Information</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Facility Name</p>
            <p className="font-medium">{user.facilityName || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Facility Type</p>
            <p className="font-medium">{user.facilityType || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Licensed Beds</p>
            <p className="font-medium">{user.licensedBeds || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Residents</p>
            <p className="font-medium">{user.currentResidents || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Medicare Provider</p>
            <p className="font-medium">{user.medicareProvider || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Medicaid Provider</p>
            <p className="font-medium">{user.medicaidProvider || "Not specified"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationSection({ user, isAdmin = false }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      adminEmail: user.adminEmail || "",
      adminPhone: user.adminPhone || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof locationSchema>) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Location & Contact Updated",
        description: "Your location and contact information has been updated successfully!",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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
        description: error.message || "Failed to update location information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof locationSchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle>Location & Contact</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Location & Contact"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <CardTitle>Location & Contact</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{user.address || "Not specified"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">City</p>
              <p className="font-medium">{user.city || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">State</p>
              <p className="font-medium">{user.state || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ZIP Code</p>
              <p className="font-medium">{user.zipCode || "Not specified"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Admin Email</p>
              <p className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {user.adminEmail || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admin Phone</p>
              <p className="font-medium flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {user.adminPhone || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServicesSection({ user, isAdmin = false }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      servicesOffered: user.servicesOffered || "",
      specializations: user.specializations || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof servicesSchema>) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Services Updated",
        description: "Your services information has been updated successfully!",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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
        description: error.message || "Failed to update services",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof servicesSchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>Services & Specializations</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="servicesOffered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Offered</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the services your facility offers..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specializations</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List your facility's specializations..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Services"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle>Services & Specializations</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Services Offered</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {user.servicesOffered || "No services specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Specializations</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {user.specializations || "No specializations specified"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutSection({ user, isAdmin = false }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      facilityDescription: user.facilityDescription || "",
      missionStatement: user.missionStatement || "",
      yearsInOperation: user.yearsInOperation || 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof aboutSchema>) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "About Us Updated",
        description: "Your facility information has been updated successfully!",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
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
        description: error.message || "Failed to update about information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof aboutSchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle>About Us</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="facilityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your facility..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="missionStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Your facility's mission statement..."
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearsInOperation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Operation</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save About Us"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle>About Us</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Facility Description</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {user.facilityDescription || "No description provided"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mission Statement</p>
            <p className="text-gray-800 whitespace-pre-wrap">
              {user.missionStatement || "No mission statement provided"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Years in Operation</p>
            <p className="font-medium">{user.yearsInOperation || "Not specified"} years</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export {
  AccountSection,
  FacilitySection,
  LocationSection,
  ServicesSection,
  AboutSection
};