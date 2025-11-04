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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit2, 
  Save, 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Building,
  Award,
  Users,
  Eye,
  Download,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

interface NursingHomeCredentialsProps {
  user: User;
}

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const facilityTypes = [
  "Skilled Nursing Facility",
  "Assisted Living Facility", 
  "Memory Care Facility",
  "Rehabilitation Center",
  "Long-term Care Facility",
  "Nursing Home",
  "Continuing Care Retirement Community",
  "Adult Day Care Center"
];

const accreditationTypes = [
  "Joint Commission",
  "CMS Certification",
  "CARF Accreditation",
  "ACHC Accreditation",
  "State Health Department License",
  "Medicare Certification",
  "Medicaid Certification"
];

// Mock data for existing certifications
const mockCertifications = [
  {
    id: 1,
    name: "Medicare Certification",
    number: "MEDICARE2024001",
    organization: "Centers for Medicare & Medicaid Services",
    issueDate: "2024-01-15",
    expiryDate: "2025-01-15",
    status: "verified"
  },
  {
    id: 2,
    name: "State Operating License",
    number: "SOL2024002", 
    organization: "California Department of Public Health",
    issueDate: "2024-02-10",
    expiryDate: "2025-02-10",
    status: "pending"
  }
];

// Verification Status Component
function VerificationStatus({ user }: { user: User }) {
  const getVerificationStatus = () => {
    const status = user.credentialsVerificationStatus || 'pending';
    switch (status) {
      case 'verified':
        return {
          color: 'green',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          icon: CheckCircle,
          title: 'Facility Credentials Verified',
          message: 'Your healthcare facility credentials have been verified. You can now post shifts and manage applications.'
        };
      case 'rejected':
        return {
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          icon: X,
          title: 'Verification Required',
          message: user.credentialsAdminNotes || 'Your facility credentials need to be updated. Please review and resubmit required documentation.'
        };
      default:
        return {
          color: 'amber',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-800 dark:text-amber-200',
          icon: Clock,
          title: 'Verification Pending',
          message: 'Your facility credentials are being reviewed by our admin team. This typically takes 3-5 business days for healthcare facilities.'
        };
    }
  };

  const statusInfo = getVerificationStatus();
  const Icon = statusInfo.icon;

  return (
    <Alert className={`${statusInfo.borderColor} ${statusInfo.bgColor}`}>
      <Icon className={`h-4 w-4 text-${statusInfo.color}-600 dark:text-${statusInfo.color}-400`} />
      <AlertDescription className={statusInfo.textColor}>
        <div className="space-y-2">
          <p className="font-semibold">{statusInfo.title}</p>
          <p className="text-sm">{statusInfo.message}</p>
          {user.credentialsAdminNotes && (
            <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
              <p className="font-medium">Admin Notes:</p>
              <p>{user.credentialsAdminNotes}</p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Facility License Section
function FacilityLicenseSection({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(z.object({
      facilityLicenseNumber: z.string().min(1, "Facility license number is required"),
      facilityType: z.string().min(1, "Facility type is required"),
      state: z.string().min(1, "State is required"),
      capacity: z.string().min(1, "Facility capacity is required"),
      establishedYear: z.string().min(4, "Established year is required"),
    })),
    defaultValues: {
      facilityLicenseNumber: user.facilityLicenseNumber || "",
      facilityType: user.facilityType || "",
      state: user.state || "",
      capacity: user.capacity?.toString() || "",
      establishedYear: user.establishedYear?.toString() || "",
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/user/profile", {
        ...data,
        capacity: parseInt(data.capacity),
        establishedYear: parseInt(data.establishedYear)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Facility License Updated",
        description: "Your facility license information has been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building className="h-5 w-5 text-blue-600" />
          <CardTitle>Facility Operating License</CardTitle>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facilityLicenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter facility license number" {...field} />
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
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility type" />
                          </SelectTrigger>
                          <SelectContent>
                            {facilityTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {usStates.map((state) => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Facility Capacity (Beds)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Number of beds" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="establishedYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Established</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="YYYY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">License Number</label>
                <p className="text-foreground">{user.facilityLicenseNumber || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Facility Type</label>
                <p className="text-foreground">{user.facilityType || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <p className="text-foreground">{user.state || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                <p className="text-foreground">{user.capacity ? `${user.capacity} beds` : "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year Established</label>
                <p className="text-foreground">{user.establishedYear || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant="outline" className="mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Verification
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Certifications Section
function CertificationsSection({ user }: { user: User }) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Certification name is required"),
      number: z.string().min(1, "Certification number is required"),
      organization: z.string().min(1, "Issuing organization is required"),
      issueDate: z.string().min(1, "Issue date is required"),
      expiryDate: z.string().min(1, "Expiry date is required"),
    })),
    defaultValues: {
      name: "",
      number: "",
      organization: "",
      issueDate: "",
      expiryDate: "",
    }
  });

  const addCertificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/facility-certifications", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certification Added",
        description: "Your facility certification has been added successfully.",
      });
      setIsAddingNew(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    addCertificationMutation.mutate(data);
  };

  const handleFileUpload = (certificationId: number) => {
    toast({
      title: "Document Uploaded",
      description: "Certification document uploaded successfully.",
    });
  };

  const handleDownload = (certificationId: number) => {
    toast({
      title: "Download Started",
      description: "Certification document download started.",
    });
  };

  const handleView = (certificationId: number) => {
    toast({
      title: "Document Viewer",
      description: "Opening certification document in viewer.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Facility Certifications & Accreditations</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsAddingNew(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCertifications.map((cert) => (
            <div key={cert.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">Certificate #{cert.number}</p>
                  <p className="text-sm text-muted-foreground">{cert.organization}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Issued: {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={cert.status === 'verified' ? 'default' : 'secondary'}>
                    {cert.status === 'verified' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleView(cert.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(cert.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFileUpload(cert.id)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          ))}

          {isAddingNew && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold mb-4">Add New Certification</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Name</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select certification type" />
                              </SelectTrigger>
                              <SelectContent>
                                {accreditationTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Certificate ID/Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CMS, Joint Commission" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={addCertificationMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {addCertificationMutation.isPending ? "Saving..." : "Add Certification"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingNew(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NursingHomeCredentials({ user }: NursingHomeCredentialsProps) {
  const requirementsList = [
    "Valid facility operating license",
    "Medicare/Medicaid certification", 
    "State health department approval",
    "Liability insurance documentation",
    "Administrator credentials verification",
    "Facility accreditation certificates",
    "Fire safety and building code compliance",
    "Background checks for key personnel"
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facility Credentials</h1>
          <p className="text-muted-foreground">
            Manage your healthcare facility credentials and certifications
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        <VerificationStatus user={user} />
        
        <Tabs defaultValue="license" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="administrators">Administrators</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="license" className="space-y-6">
            <FacilityLicenseSection user={user} />
          </TabsContent>
          
          <TabsContent value="certifications" className="space-y-6">
            <CertificationsSection user={user} />
          </TabsContent>
          
          <TabsContent value="administrators" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Administrator Credentials</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Administrator Verification</h3>
                  <p className="text-gray-600 mb-4">Add administrator credentials and nursing home management certifications.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Administrator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insurance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>Insurance & Liability</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Insurance Documentation</h3>
                  <p className="text-gray-600 mb-4">Upload liability insurance and malpractice coverage documents.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Insurance Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Supporting Documents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Document Upload</h3>
                  <p className="text-gray-600 mb-4">Upload licenses, certificates, inspection reports, and other required documents.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">US Healthcare Facility Verification Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {requirementsList.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}