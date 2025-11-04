import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Award,
  Shield,
  Calendar,
  Download,
  Eye,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

interface CredentialsVerificationProps {
  user: User;
  userType: "nurse" | "nursing_home";
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

const nursingLicenseTypes = [
  "Registered Nurse (RN)",
  "Licensed Practical Nurse (LPN)",
  "Certified Nursing Assistant (CNA)",
  "Advanced Practice Registered Nurse (APRN)",
  "Nurse Practitioner (NP)",
  "Clinical Nurse Specialist (CNS)",
  "Certified Registered Nurse Anesthetist (CRNA)",
  "Certified Nurse Midwife (CNM)"
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

// Mock data for existing credentials
const mockCertifications = [
  {
    id: 1,
    name: "BLS - Basic Life Support",
    number: "BLS2024001",
    organization: "American Heart Association",
    issueDate: "2024-01-15",
    expiryDate: "2026-01-15",
    status: "verified"
  },
  {
    id: 2,
    name: "ACLS - Advanced Cardiac Life Support",
    number: "ACLS2024002",
    organization: "American Heart Association",
    issueDate: "2024-02-10",
    expiryDate: "2026-02-10",
    status: "pending"
  }
];

const mockEducation = [
  {
    id: 1,
    degree: "Bachelor of Science in Nursing (BSN)",
    institution: "University of California, Los Angeles",
    graduationYear: 2020,
    gpa: "3.8",
    status: "verified"
  }
];

const mockExperience = [
  {
    id: 1,
    facilityName: "Cedar-Sinai Medical Center",
    position: "Staff Nurse - ICU",
    startDate: "2020-06-01",
    endDate: "2023-05-30",
    responsibilities: "Provided direct patient care in intensive care unit",
    contactPerson: "Jane Smith, RN Manager",
    contactPhone: "(555) 123-4567",
    status: "verified"
  }
];

const mockReferences = [
  {
    id: 1,
    name: "Sarah Martinez, RN",
    position: "Charge Nurse",
    facility: "Cedar-Sinai Medical Center",
    phone: "(555) 123-4567",
    email: "sarah.martinez@cedars-sinai.org",
    relationship: "Direct Supervisor",
    yearsKnown: "3",
    status: "verified"
  }
];

// Verification Status Component
function VerificationStatus({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
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
          title: 'Credentials Verified',
          message: userType === 'nurse' 
            ? 'Your nursing credentials have been verified. You can apply for shifts.' 
            : 'Your facility credentials have been verified. You can post shifts.'
        };
      case 'rejected':
        return {
          color: 'red',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          icon: X,
          title: 'Verification Required',
          message: user.credentialsAdminNotes || 'Your credentials need to be updated. Please review and resubmit.'
        };
      default:
        return {
          color: 'amber',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-800 dark:text-amber-200',
          icon: Clock,
          title: 'Verification Pending',
          message: userType === 'nurse'
            ? 'Your credentials are being reviewed by our admin team. This typically takes 2-3 business days.'
            : 'Your facility credentials are being reviewed by our admin team.'
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

// License Section Component
function LicenseSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch license data
  const { data: license, isLoading: licenseLoading } = useQuery({
    queryKey: ["/api/license"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      licenseNumber: z.string().min(1, "License number is required"),
      licenseType: z.string().min(1, "License type is required"),
      licenseState: z.string().min(1, "License state is required"),
      expiryDate: z.string().min(1, "Expiry date is required"),
    })),
    defaultValues: {
      licenseNumber: user.licenseNumber || "",
      licenseType: user.licenseType || "",
      licenseState: user.state || "",
      expiryDate: "",
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/license", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "License Updated",
        description: "Your license information has been saved successfully.",
      });
      setIsEditing(false);
      // Invalidate and refetch license data
      queryClient.invalidateQueries({ queryKey: ["/api/license"] });
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
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle>
            {userType === 'nurse' ? 'Nursing License' : 'Facility License'}
          </CardTitle>
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
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select license type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(userType === 'nurse' ? nursingLicenseTypes : facilityTypes).map((type) => (
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
                  name="licenseState"
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
              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        ) : licenseLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">License Number</label>
                <p className="text-foreground">{license?.licenseNumber || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">License Type</label>
                <p className="text-foreground">{license?.licenseType || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <p className="text-foreground">{license?.issuingState || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={license?.status === 'verified' ? 'default' : 'outline'} className="mt-1">
                  {license?.status === 'verified' ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Verification
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Certifications Section Component
function CertificationsSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch certifications data
  const { data: certifications = [], isLoading: certificationsLoading } = useQuery({
    queryKey: ["/api/certifications"],
    retry: false,
  });

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
      const url = editingId ? `/api/certifications/${editingId}` : "/api/certifications";
      const method = editingId ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Certification Updated" : "Certification Added",
        description: editingId ? "Your certification has been updated successfully." : "Your certification has been added successfully.",
      });
      setIsAddingNew(false);
      setEditingId(null);
      form.reset();
      // Invalidate and refetch certifications
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
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

  const deleteCertificationMutation = useMutation({
    mutationFn: async (certId: number) => {
      const response = await apiRequest("DELETE", `/api/certifications/${certId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Certification Deleted",
        description: "Your certification has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (certificationId: number) => {
    if (confirm("Are you sure you want to delete this certification?")) {
      deleteCertificationMutation.mutate(certificationId);
    }
  };

  const handleFileUpload = (certificationId: number) => {
    toast({
      title: "Document Upload",
      description: "Document upload functionality will be available soon.",
    });
  };

  const handleDownload = (certificationId: number) => {
    toast({
      title: "Download",
      description: "Document download functionality will be available soon.",
    });
  };

  const handleView = (certificationId: number) => {
    toast({
      title: "Document Viewer",
      description: "Document viewing functionality will be available soon.",
    });
  };

  const handleEdit = (certificationId: number) => {
    const cert = certifications.find((c: any) => c.id === certificationId);
    if (cert) {
      form.reset({
        name: cert.name,
        number: cert.number,
        organization: cert.organization,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
      });
      setEditingId(certificationId);
      setIsAddingNew(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Professional Certifications</span>
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
      <CardContent className="p-2 sm:p-6">
        {certificationsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No certifications added yet</p>
              </div>
            ) : (
              certifications.map((cert: any) => (
                <div key={cert.id} className="border rounded-lg p-3 space-y-3 bg-white dark:bg-gray-800 mx-1">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{cert.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Certificate #{cert.number}</p>
                    <p className="text-xs text-muted-foreground">{cert.organization}</p>
                  </div>
                  <Badge variant={cert.status === 'verified' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
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
                
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                  <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleView(cert.id)}
                  className="text-xs h-8 px-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(cert.id)}
                  className="text-xs h-8 px-2"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDelete(cert.id)}
                  className="text-xs h-8 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
                </div>
              ))
            )}

          {isAddingNew && (
            <div className="border rounded-lg p-3 sm:p-4 bg-muted/30">
              <h3 className="font-semibold mb-4 text-sm sm:text-base">Add New Certification</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Certification Name</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select certification type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Basic Life Support (BLS)">Basic Life Support (BLS)</SelectItem>
                                <SelectItem value="Advanced Cardiovascular Life Support (ACLS)">Advanced Cardiovascular Life Support (ACLS)</SelectItem>
                                <SelectItem value="Pediatric Advanced Life Support (PALS)">Pediatric Advanced Life Support (PALS)</SelectItem>
                                <SelectItem value="Critical Care Registered Nurse (CCRN)">Critical Care Registered Nurse (CCRN)</SelectItem>
                                <SelectItem value="Certified Emergency Nurse (CEN)">Certified Emergency Nurse (CEN)</SelectItem>
                                <SelectItem value="Oncology Certified Nurse (OCN)">Oncology Certified Nurse (OCN)</SelectItem>
                                <SelectItem value="Certified Pediatric Nurse (CPN)">Certified Pediatric Nurse (CPN)</SelectItem>
                                <SelectItem value="Wound Ostomy Continence Nurse (WOCN)">Wound Ostomy Continence Nurse (WOCN)</SelectItem>
                                <SelectItem value="Certified Nurse Operating Room (CNOR)">Certified Nurse Operating Room (CNOR)</SelectItem>
                                <SelectItem value="Medical-Surgical Nursing Certification (CMSRN)">Medical-Surgical Nursing Certification (CMSRN)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Certification Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Certificate ID/Number" {...field} className="text-sm" />
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
                            <FormLabel className="text-sm">Issuing Organization</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., American Heart Association" {...field} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Issue Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="text-sm" />
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
                            <FormLabel className="text-sm">Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="text-sm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={addCertificationMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {addCertificationMutation.isPending ? "Saving..." : "Add Certification"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false);
                        form.reset();
                      }}
                      className="text-sm sm:flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Education Section Component
function EducationSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch education data
  const { data: education = [], isLoading: educationLoading } = useQuery({
    queryKey: ["/api/education"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      degree: z.string().min(1, "Degree is required"),
      institution: z.string().min(1, "Institution is required"),
      graduationYear: z.string().min(4, "Graduation year is required"),
      gpa: z.string().optional(),
      majorCourses: z.string().optional(),
      achievements: z.string().optional()
    })),
    defaultValues: {
      degree: "",
      institution: "",
      graduationYear: "",
      gpa: "",
      majorCourses: "",
      achievements: ""
    }
  });

  const addEducationMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingId ? `/api/education/${editingId}` : "/api/education";
      const method = editingId ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Education Updated" : "Education Added",
        description: editingId ? "Your education record has been updated successfully." : "Your education record has been added successfully.",
      });
      setShowAddForm(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/education"] });
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
    addEducationMutation.mutate(data);
  };

  const deleteEducationMutation = useMutation({
    mutationFn: async (educationId: number) => {
      const response = await apiRequest("DELETE", `/api/education/${educationId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Education Deleted",
        description: "Your education record has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (educationId: number) => {
    const edu = education.find((e: any) => e.id === educationId);
    if (edu) {
      form.reset({
        degree: edu.degree,
        institution: edu.institution,
        graduationYear: edu.graduationYear,
        gpa: edu.gpa,
        majorCourses: edu.majorCourses,
        achievements: edu.achievements,
      });
      setEditingId(educationId);
      setShowAddForm(true);
    }
  };

  const handleDelete = (educationId: number) => {
    if (confirm("Are you sure you want to delete this education record?")) {
      deleteEducationMutation.mutate(educationId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>Education History</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {educationLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : education.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No education records added yet</p>
          </div>
        ) : (
          education.map((educationItem: any) => (
            <div key={educationItem.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{educationItem.degree}</h3>
                  <p className="text-sm text-muted-foreground">{educationItem.institution}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Graduated: {educationItem.graduationYear}
                    </span>
                    {educationItem.gpa && (
                      <span className="text-sm text-muted-foreground">
                        GPA: {educationItem.gpa}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={educationItem.status === 'verified' ? 'default' : 'secondary'}>
                    {educationItem.status === 'verified' ? (
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
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-4">Add Education</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree/Program</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bachelor of Science in Nursing" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution</FormLabel>
                        <FormControl>
                          <Input placeholder="University/College name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input placeholder="YYYY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gpa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPA (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3.8/4.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="majorCourses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Major Courses (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List relevant courses or specializations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achievements/Honors (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Dean's list, scholarships, academic honors, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" disabled={addEducationMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {addEducationMutation.isPending ? "Saving..." : "Save Education"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Experience Section Component
function ExperienceSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch experience data
  const { data: experience = [], isLoading: experienceLoading } = useQuery({
    queryKey: ["/api/experience"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      facilityName: z.string().min(1, "Facility name is required"),
      position: z.string().min(1, "Position is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrentPosition: z.boolean().default(false),
      responsibilities: z.string().min(1, "Responsibilities are required"),
      contactPerson: z.string().min(1, "Contact person is required"),
      contactPhone: z.string().min(1, "Contact phone is required"),
      contactEmail: z.string().email("Valid email is required").optional()
    })),
    defaultValues: {
      facilityName: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrentPosition: false,
      responsibilities: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: ""
    }
  });

  const addExperienceMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingId ? `/api/experience/${editingId}` : "/api/experience";
      const method = editingId ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Experience Updated" : "Experience Added",
        description: editingId ? "Your work experience has been updated successfully." : "Your work experience has been added successfully.",
      });
      setShowAddForm(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/experience"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: async (experienceId: number) => {
      const response = await apiRequest("DELETE", `/api/experience/${experienceId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience Deleted",
        description: "Your work experience has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/experience"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (experienceId: number) => {
    const exp = experience.find((e: any) => e.id === experienceId);
    if (exp) {
      form.reset({
        facility: exp.facility,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        department: exp.department,
        responsibilities: exp.responsibilities,
        contactPerson: exp.contactPerson,
        contactPhone: exp.contactPhone,
        contactEmail: exp.contactEmail,
      });
      setEditingId(experienceId);
      setShowAddForm(true);
    }
  };

  const handleDelete = (experienceId: number) => {
    if (confirm("Are you sure you want to delete this experience record?")) {
      deleteExperienceMutation.mutate(experienceId);
    }
  };

  const onSubmit = (data: any) => {
    addExperienceMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <span>Work Experience</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {experienceLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : experience.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No work experience added yet</p>
          </div>
        ) : (
          experience.map((experienceItem: any) => (
            <div key={experienceItem.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{experienceItem.position}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{experienceItem.facilityName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(experienceItem.startDate).toLocaleDateString()} - {new Date(experienceItem.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">{experienceItem.responsibilities}</p>
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <p className="font-medium">Contact Reference:</p>
                    <p>{experienceItem.contactPerson}</p>
                    <p>{experienceItem.contactPhone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={experienceItem.status === 'verified' ? 'default' : 'secondary'}>
                    {experienceItem.status === 'verified' ? (
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
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-4">Add Work Experience</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="facilityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Healthcare Facility</FormLabel>
                        <FormControl>
                          <Input placeholder="Hospital/Clinic name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Staff Nurse, Charge Nurse" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={form.watch('isCurrentPosition')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isCurrentPosition"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        This is my current position
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Responsibilities</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your main duties and responsibilities" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supervisor/Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Name and title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="supervisor@facility.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" disabled={addExperienceMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {addExperienceMutation.isPending ? "Saving..." : "Save Experience"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// References Section Component
function ReferencesSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch references data
  const { data: references = [], isLoading: referencesLoading } = useQuery({
    queryKey: ["/api/references"],
    retry: false,
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Name is required"),
      position: z.string().min(1, "Position is required"),
      facility: z.string().min(1, "Facility is required"),
      phone: z.string().min(1, "Phone is required"),
      email: z.string().email("Valid email is required"),
      relationship: z.string().min(1, "Relationship is required"),
      yearsKnown: z.string().min(1, "Years known is required")
    })),
    defaultValues: {
      name: "",
      position: "",
      facility: "",
      phone: "",
      email: "",
      relationship: "",
      yearsKnown: ""
    }
  });

  const addReferenceMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingId ? `/api/references/${editingId}` : "/api/references";
      const method = editingId ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: editingId ? "Reference Updated" : "Reference Added",
        description: editingId ? "Your professional reference has been updated successfully." : "Your professional reference has been added successfully.",
      });
      setShowAddForm(false);
      setEditingId(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReferenceMutation = useMutation({
    mutationFn: async (referenceId: number) => {
      const response = await apiRequest("DELETE", `/api/references/${referenceId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reference Deleted",
        description: "Your professional reference has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/references"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (referenceId: number) => {
    const ref = references.find((r: any) => r.id === referenceId);
    if (ref) {
      form.reset({
        name: ref.name,
        position: ref.position,
        facility: ref.facility,
        phone: ref.phone,
        email: ref.email,
        relationship: ref.relationship,
        yearsKnown: ref.yearsKnown,
      });
      setEditingId(referenceId);
      setShowAddForm(true);
    }
  };

  const handleDelete = (referenceId: number) => {
    if (confirm("Are you sure you want to delete this reference?")) {
      deleteReferenceMutation.mutate(referenceId);
    }
  };

  const onSubmit = (data: any) => {
    addReferenceMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Professional References</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {referencesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : references.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No references added yet</p>
          </div>
        ) : (
          references.map((reference: any) => (
            <div key={reference.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{reference.name}</h3>
                  <p className="text-sm text-muted-foreground">{reference.position}</p>
                  <p className="text-sm text-muted-foreground">{reference.facility}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">Phone: {reference.phone}</p>
                    <p className="text-sm text-muted-foreground">Email: {reference.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Relationship: {reference.relationship} • Known for {reference.yearsKnown} years
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={reference.status === 'verified' ? 'default' : 'secondary'}>
                    {reference.status === 'verified' ? (
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
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        {showAddForm && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-4">Add Professional Reference</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Reference's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Their job title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility/Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Where they work" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Relationship</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="direct_supervisor">Direct Supervisor</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="colleague">Colleague</SelectItem>
                              <SelectItem value="attending_physician">Attending Physician</SelectItem>
                              <SelectItem value="charge_nurse">Charge Nurse</SelectItem>
                              <SelectItem value="mentor">Mentor</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact phone" {...field} />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Contact email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="yearsKnown"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years Known</FormLabel>
                      <FormControl>
                        <Input placeholder="How long have you worked with them?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" disabled={addReferenceMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {addReferenceMutation.isPending ? "Saving..." : "Save Reference"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Documents Section Component  
function DocumentsSection({ user, userType }: { user: User; userType: "nurse" | "nursing_home" }) {
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: "Nursing_License.pdf", type: "License", uploadDate: "2024-01-15", status: "verified" },
    { id: 2, name: "BLS_Certificate.pdf", type: "Certification", uploadDate: "2024-01-20", status: "verified" },
    { id: 3, name: "Resume.pdf", type: "Resume", uploadDate: "2024-02-01", status: "pending" },
  ]);
  const { toast } = useToast();

  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await apiRequest("POST", "/api/upload-document", documentData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully.",
      });
      // Update local state
      setUploadedFiles(prev => [...prev, {
        id: data.document.id,
        name: data.document.fileName,
        type: data.document.documentType,
        uploadDate: new Date(data.document.uploadedAt).toISOString().split('T')[0],
        status: data.document.status
      }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const documentData = {
          fileName: file.name,
          fileType: file.type,
          documentType: "credential_document"
        };
        uploadDocumentMutation.mutate(documentData);
      });
    }
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    });
  };

  const handleView = (fileName: string) => {
    toast({
      title: "Document Viewer",
      description: `Opening ${fileName} in viewer.`,
    });
  };

  const handleDelete = (fileId: number) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    toast({
      title: "Document Deleted",
      description: "Document has been removed successfully.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle>Documents</CardTitle>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file.type} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={file.status === 'verified' ? 'default' : 'secondary'}>
                  {file.status === 'verified' ? (
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleView(file.name)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDownload(file.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {uploadedFiles.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Documents Uploaded</h3>
              <p className="text-gray-600 mb-4">Upload your licenses, certificates, and other required documents.</p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CredentialsVerificationFixed({ user, userType }: CredentialsVerificationProps) {
  const requirementsList = userType === 'nurse' 
    ? [
        "Valid nursing license with state registration",
        "Current BLS/CPR certification", 
        "Education transcripts and diplomas",
        "Professional work experience verification",
        "Professional references (minimum 2)",
        "Background check completion"
      ]
    : [
        "Valid facility operating license",
        "Medicare/Medicaid certification",
        "State health department approval",
        "Liability insurance documentation",
        "Administrator credentials verification",
        "Facility accreditation certificates"
      ];

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto py-4 px-3 sm:px-4 space-y-4 sm:space-y-6 pb-32 md:pb-8 max-w-full" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
              {userType === 'nurse' ? 'Nursing Credentials' : 'Facility Credentials'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              {userType === 'nurse' 
                ? 'Manage your professional nursing credentials and certifications'
                : 'Manage your healthcare facility credentials and certifications'
              }
            </p>
          </div>
        </div>
      
        <div className="space-y-4 sm:space-y-6">
          <VerificationStatus user={user} userType={userType} />
          
          <Tabs defaultValue="license" className="w-full">
            <div className="w-full overflow-x-auto scrollbar-hide tab-scroll mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <TabsList className="inline-flex bg-muted p-1 rounded-lg" style={{ minWidth: 'max-content' }}>
                <TabsTrigger value="license" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">License</TabsTrigger>
                <TabsTrigger value="certifications" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">Certifications</TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">Education</TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">Experience</TabsTrigger>
                <TabsTrigger value="references" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">References</TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-xs px-3 py-2 rounded-md transition-all whitespace-nowrap">Documents</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="license" className="space-y-4 sm:space-y-6">
              <LicenseSection user={user} userType={userType} />
            </TabsContent>
            
            <TabsContent value="certifications" className="space-y-4 sm:space-y-6">
              <CertificationsSection user={user} userType={userType} />
            </TabsContent>
            
            <TabsContent value="education" className="space-y-4 sm:space-y-6">
              <EducationSection user={user} userType={userType} />
            </TabsContent>
            
            <TabsContent value="experience" className="space-y-4 sm:space-y-6">
              <ExperienceSection user={user} userType={userType} />
            </TabsContent>
            
            <TabsContent value="references" className="space-y-4 sm:space-y-6">
              <ReferencesSection user={user} userType={userType} />
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 sm:space-y-6">
              <DocumentsSection user={user} userType={userType} />
            </TabsContent>
          </Tabs>

          <Alert className="mt-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-sm">Verification Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                  {requirementsList.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}