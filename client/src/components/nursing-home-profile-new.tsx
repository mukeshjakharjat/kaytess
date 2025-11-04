import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Globe, FileText, Award, Shield, CheckCircle } from "lucide-react";
import type { User } from "@shared/schema";

interface NursingHomeProfileProps {
  user: User;
  isAdmin?: boolean;
}

export default function NursingHomeProfileNew({ user, isAdmin = false }: NursingHomeProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [profileData, setProfileData] = useState({
    facilityName: "",
    facilityType: "",
    facilityLicenseNumber: "",
    capacity: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    facilityPhone: "",
    facilityEmail: "",
    website: "",
    adminName: "",
    adminTitle: "",
    establishedYear: "",
    emergencyContact: "",
    medicaidCertified: false,
    medicareCertified: false,
    description: "",
    servicesOffered: "",
  });

  // Initialize form data from user
  useEffect(() => {
    if (user && user.id) {
      setProfileData({
        facilityName: user.facilityName || "",
        facilityType: user.facilityType || "",
        facilityLicenseNumber: user.facilityLicenseNumber || "",
        capacity: user.capacity?.toString() || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        facilityPhone: user.facilityPhone || "",
        facilityEmail: user.facilityEmail || "",
        website: user.website || "",
        adminName: user.adminName || "",
        adminTitle: user.adminTitle || "",
        establishedYear: user.establishedYear?.toString() || "",
        emergencyContact: user.emergencyContact || "",
        medicaidCertified: user.medicaidCertified || false,
        medicareCertified: user.medicareCertified || false,
        description: user.description || "",
        servicesOffered: user.servicesOffered || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isAdmin ? `/api/users/${user.id}` : "/api/user/profile";
      const method = isAdmin ? "PATCH" : "PUT";
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile Updated",
        description: "Your nursing home profile has been updated successfully!",
      });
      // Update the query cache with the new user data
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Update local state to reflect the changes immediately
      setProfileData({
        facilityName: updatedUser.facilityName || "",
        facilityType: updatedUser.facilityType || "",
        facilityLicenseNumber: updatedUser.facilityLicenseNumber || "",
        capacity: updatedUser.capacity?.toString() || "",
        address: updatedUser.address || "",
        city: updatedUser.city || "",
        state: updatedUser.state || "",
        zipCode: updatedUser.zipCode || "",
        facilityPhone: updatedUser.facilityPhone || "",
        facilityEmail: updatedUser.facilityEmail || "",
        website: updatedUser.website || "",
        adminName: updatedUser.adminName || "",
        adminTitle: updatedUser.adminTitle || "",
        establishedYear: updatedUser.establishedYear?.toString() || "",
        emergencyContact: updatedUser.emergencyContact || "",
        medicaidCertified: updatedUser.medicaidCertified || false,
        medicareCertified: updatedUser.medicareCertified || false,
        description: updatedUser.description || "",
        servicesOffered: updatedUser.servicesOffered || "",
      });
      
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
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const verifyNursingHomeMutation = useMutation({
    mutationFn: async ({ userId, verified, notes }: { userId: string; verified: boolean; notes: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        isVerified: verified,
        verificationNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Updated",
        description: "Nursing home verification status has been updated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...profileData,
      capacity: parseInt(profileData.capacity) || null,
      establishedYear: parseInt(profileData.establishedYear) || null,
    };

    updateProfileMutation.mutate(submissionData);
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVerification = (verified: boolean) => {
    const notes = verified ? "Facility verified by admin" : "Verification revoked by admin";
    verifyNursingHomeMutation.mutate({ userId: user.id, verified, notes });
  };

  if (!user || user.role !== "nursing_home") {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            This profile is only available for nursing home users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-healthcare-blue rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profileData.facilityName || "Nursing Home Profile"}
            </h1>
            <p className="text-muted-foreground">
              {profileData.facilityType?.replace('_', ' ').toUpperCase() || "Healthcare Facility"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {user.isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified Facility
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Shield className="h-3 w-3 mr-1" />
              Pending Verification
            </Badge>
          )}
          
          {isAdmin && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant={user.isVerified ? "outline" : "default"}
                onClick={() => handleVerification(!user.isVerified)}
                className={user.isVerified ? "text-red-600 hover:text-red-700" : "bg-green-600 hover:bg-green-700"}
              >
                {user.isVerified ? "Revoke Verification" : "Verify Facility"}
              </Button>
            </div>
          )}
          
          {!isAdmin && (
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          )}
        </div>
      </div>

      {isEditing || isAdmin ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Facility Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Facility Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facilityName">Facility Name *</Label>
                  <Input
                    id="facilityName"
                    value={profileData.facilityName}
                    onChange={(e) => handleInputChange("facilityName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="facilityType">Facility Type *</Label>
                  <Select 
                    value={profileData.facilityType}
                    onValueChange={(value) => handleInputChange("facilityType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skilled_nursing">Skilled Nursing Facility</SelectItem>
                      <SelectItem value="assisted_living">Assisted Living</SelectItem>
                      <SelectItem value="memory_care">Memory Care</SelectItem>
                      <SelectItem value="rehabilitation">Rehabilitation Center</SelectItem>
                      <SelectItem value="long_term_care">Long-term Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facilityLicenseNumber">Facility License Number *</Label>
                  <Input
                    id="facilityLicenseNumber"
                    value={profileData.facilityLicenseNumber}
                    onChange={(e) => handleInputChange("facilityLicenseNumber", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Bed Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={profileData.capacity}
                    onChange={(e) => handleInputChange("capacity", e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profileData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={profileData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="facilityPhone">Phone Number</Label>
                  <Input
                    id="facilityPhone"
                    type="tel"
                    value={profileData.facilityPhone}
                    onChange={(e) => handleInputChange("facilityPhone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="facilityEmail">Email Address</Label>
                  <Input
                    id="facilityEmail"
                    type="email"
                    value={profileData.facilityEmail}
                    onChange={(e) => handleInputChange("facilityEmail", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={profileData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>

          {/* Administration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Administration & Certification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminName">Administrator Name</Label>
                  <Input
                    id="adminName"
                    value={profileData.adminName}
                    onChange={(e) => handleInputChange("adminName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="adminTitle">Administrator Title</Label>
                  <Input
                    id="adminTitle"
                    value={profileData.adminTitle}
                    onChange={(e) => handleInputChange("adminTitle", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={profileData.establishedYear}
                    onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={profileData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medicaidCertified"
                    checked={profileData.medicaidCertified}
                    onCheckedChange={(checked) => handleInputChange("medicaidCertified", checked)}
                  />
                  <Label htmlFor="medicaidCertified">Medicaid Certified</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medicareCertified"
                    checked={profileData.medicareCertified}
                    onCheckedChange={(checked) => handleInputChange("medicareCertified", checked)}
                  />
                  <Label htmlFor="medicareCertified">Medicare Certified</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Description & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Facility Description</Label>
                <Textarea
                  id="description"
                  value={profileData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  placeholder="Describe your facility, mission, and values..."
                />
              </div>
              
              <div>
                <Label htmlFor="servicesOffered">Services Offered</Label>
                <Textarea
                  id="servicesOffered"
                  value={profileData.servicesOffered}
                  onChange={(e) => handleInputChange("servicesOffered", e.target.value)}
                  rows={3}
                  placeholder="List the services and specialties your facility offers..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
            {!isAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      ) : (
        // View Mode
        <div className="space-y-6">
          {/* Facility Information - View Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Facility Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Facility Name</Label>
                  <p className="text-foreground">{profileData.facilityName || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Facility Type</Label>
                  <p className="text-foreground">
                    {profileData.facilityType ? profileData.facilityType.replace('_', ' ').toUpperCase() : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">License Number</Label>
                  <p className="text-foreground">{profileData.facilityLicenseNumber || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Bed Capacity</Label>
                  <p className="text-foreground">{profileData.capacity || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Contact - View Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-foreground">
                  {profileData.address && profileData.city && profileData.state 
                    ? `${profileData.address}, ${profileData.city}, ${profileData.state} ${profileData.zipCode || ""}`
                    : "Not specified"
                  }
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-foreground">{profileData.facilityPhone || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-foreground">{profileData.facilityEmail || "Not specified"}</p>
                </div>
              </div>
              {profileData.website && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                  <p className="text-foreground">
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {profileData.website}
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certification - View Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Certification & Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Administrator</Label>
                  <p className="text-foreground">
                    {profileData.adminName ? `${profileData.adminName}${profileData.adminTitle ? `, ${profileData.adminTitle}` : ""}` : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Established</Label>
                  <p className="text-foreground">{profileData.establishedYear || "Not specified"}</p>
                </div>
              </div>
              <div className="flex space-x-4">
                {profileData.medicaidCertified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Medicaid Certified
                  </Badge>
                )}
                {profileData.medicareCertified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Medicare Certified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description & Services - View Mode */}
          {(profileData.description || profileData.servicesOffered) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  About Our Facility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profileData.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="text-foreground">{profileData.description}</p>
                  </div>
                )}
                {profileData.servicesOffered && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Services Offered</Label>
                    <p className="text-foreground">{profileData.servicesOffered}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}