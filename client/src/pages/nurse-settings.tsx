import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { MapPin, User, Phone, Mail, Save } from "lucide-react";

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialties: z.union([z.string(), z.array(z.string())]).optional(),
  bio: z.string().optional(),
  isAvailableForShifts: z.boolean().default(true),
  preferredRadius: z.number().min(1).max(100).optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function NurseSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      licenseNumber: "",
      specialties: "",
      bio: "",
      isAvailableForShifts: true,
      preferredRadius: 25,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const res = await apiRequest("PATCH", `/api/users/${(user as any)?.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      // Immediately update cache and force complete re-render
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Force immediate form reset with updated data
      setTimeout(() => {
        profileForm.reset({
          firstName: updatedUser.firstName || "",
          lastName: updatedUser.lastName || "",
          email: updatedUser.email || "",
          phoneNumber: updatedUser.phoneNumber || "",
          address: updatedUser.address || "",
          city: updatedUser.city || "",
          state: updatedUser.state || "",
          zipCode: updatedUser.zipCode || "",
          licenseNumber: updatedUser.licenseNumber || "",
          specialties: Array.isArray(updatedUser.specialties) ? updatedUser.specialties.join(', ') : "",
          bio: updatedUser.bio || "",
          isAvailableForShifts: updatedUser.isAvailableForShifts ?? true,
          preferredRadius: updatedUser.preferredRadius || 25,
        });
      }, 100);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form when user data changes but prevent during mutations
  useEffect(() => {
    if (user && !updateProfileMutation.isPending) {
      profileForm.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        email: (user as any)?.email || "",
        phoneNumber: (user as any)?.phoneNumber || "",
        address: (user as any)?.address || "",
        city: (user as any)?.city || "",
        state: (user as any)?.state || "",
        zipCode: (user as any)?.zipCode || "",
        licenseNumber: (user as any)?.licenseNumber || "",
        specialties: Array.isArray((user as any)?.specialties) ? (user as any)?.specialties.join(', ') : "",
        bio: (user as any)?.bio || "",
        isAvailableForShifts: (user as any)?.isAvailableForShifts ?? true,
        preferredRadius: (user as any)?.preferredRadius || 25,
      });
    }
  }, [user, profileForm, updateProfileMutation.isPending]);

  const onSubmit = (data: ProfileUpdateData, e?: React.BaseSyntheticEvent) => {
    // Prevent default form submission and page navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Convert specialties string to array for database storage
    const processedData = {
      ...data,
      specialties: typeof data.specialties === 'string' && data.specialties ? 
        data.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : 
        Array.isArray(data.specialties) ? data.specialties : []
    };
    
    updateProfileMutation.mutate(processedData as any);
    
    // Prevent any form navigation
    return false;
  };

  // Google Places integration for address autocomplete
  const initializeAddressAutocomplete = () => {
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      const addressInput = document.getElementById('address') as HTMLInputElement;
      if (addressInput) {
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            // Extract address components
            const addressComponents = place.address_components;
            let city = '', state = '', zipCode = '';

            addressComponents?.forEach((component) => {
              const types = component.types;
              if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name;
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name;
              }
            });

            // Update form values
            profileForm.setValue('address', place.formatted_address || '');
            profileForm.setValue('city', city);
            profileForm.setValue('state', state);
            profileForm.setValue('zipCode', zipCode);
          }
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 max-w-4xl mx-auto p-4 lg:p-6 pb-24 lg:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        </div>

        <Form {...profileForm}>
          <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            profileForm.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself, your experience, and what drives your passion for nursing..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={profileForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input 
                        id="address"
                        placeholder="Enter your address (Google autocomplete enabled)"
                        onFocus={initializeAddressAutocomplete}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
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

              <FormField
                control={profileForm.control}
                name="preferredRadius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Work Radius (miles)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="100" 
                        placeholder="25"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="RN12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties</FormLabel>
                      <FormControl>
                        <Input placeholder="ICU, Emergency, Pediatrics (comma-separated)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="isAvailableForShifts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Available for Shifts</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Turn this off if you're temporarily unavailable for new shift assignments
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

            <div className="flex justify-end sticky bottom-4 lg:static lg:bottom-auto">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Get form data directly and process it
                  const formData = profileForm.getValues();
                  const processedData = {
                    ...formData,
                    specialties: typeof formData.specialties === 'string' && formData.specialties ? 
                      formData.specialties.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : 
                      Array.isArray(formData.specialties) ? formData.specialties : []
                  };
                  
                  // Call mutation directly without form submission
                  updateProfileMutation.mutate(processedData);
                }}
                disabled={updateProfileMutation.isPending}
                className="bg-primary hover:bg-primary/90 w-full lg:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>


      </div>
    </div>
  );
}

