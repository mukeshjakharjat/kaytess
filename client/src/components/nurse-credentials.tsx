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

// Schemas for different credential sections
const licenseSchema = z.object({
  licenseNumber: z.string().min(1, "License number is required"),
  licenseType: z.string().min(1, "License type is required"),
  licenseState: z.string().min(1, "License state is required"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  licenseStatus: z.string().min(1, "License status is required"),
});

const certificationSchema = z.object({
  certificationName: z.string().min(1, "Certification name is required"),
  certificationNumber: z.string().optional(),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  graduationYear: z.number().min(1950, "Valid graduation year required"),
  gpa: z.string().optional(),
});

const workExperienceSchema = z.object({
  facilityName: z.string().min(1, "Facility name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  responsibilities: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
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

const LICENSE_TYPES = [
  "RN - Registered Nurse",
  "LPN - Licensed Practical Nurse",
  "CNA - Certified Nursing Assistant",
  "APRN - Advanced Practice Registered Nurse",
  "CNS - Clinical Nurse Specialist",
  "CRNA - Certified Registered Nurse Anesthetist",
  "CNM - Certified Nurse Midwife",
  "NP - Nurse Practitioner"
];

const CERTIFICATION_TYPES = [
  "BLS - Basic Life Support",
  "ACLS - Advanced Cardiac Life Support",
  "PALS - Pediatric Advanced Life Support",
  "CPR - Cardiopulmonary Resuscitation",
  "NIHSS - NIH Stroke Scale",
  "TNCC - Trauma Nursing Core Course",
  "CEN - Certified Emergency Nurse",
  "CCRN - Critical Care Registered Nurse",
  "OCN - Oncology Certified Nurse",
  "FNP-BC - Family Nurse Practitioner Board Certified"
];

interface NurseCredentialsProps {
  user: User;
}

// Mock data for existing credentials (in real app, this would come from API)
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
  },
  {
    id: 3,
    name: "PALS - Pediatric Advanced Life Support",
    number: "PALS2024003",
    organization: "American Heart Association",
    issueDate: "2024-03-05",
    expiryDate: "2026-03-05",
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
  },
  {
    id: 2,
    degree: "Associate Degree in Nursing (ADN)",
    institution: "Santa Monica College",
    graduationYear: 2018,
    gpa: "3.5",
    status: "pending"
  }
];

const mockExperience = [
  {
    id: 1,
    facilityName: "Cedar-Sinai Medical Center",
    position: "Staff Nurse - ICU",
    startDate: "2020-06-01",
    endDate: "2023-05-30",
    responsibilities: "Provided direct patient care in intensive care unit, administered medications, monitored vital signs",
    contactPerson: "Jane Smith, RN Manager",
    contactPhone: "(555) 123-4567",
    status: "verified"
  },
  {
    id: 2,
    facilityName: "UCLA Medical Center",
    position: "Graduate Nurse Intern",
    startDate: "2020-01-01",
    endDate: "2020-05-30",
    responsibilities: "Assisted with patient care under supervision, learned hospital protocols",
    contactPerson: "Robert Johnson, RN",
    contactPhone: "(555) 987-6543",
    status: "pending"
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
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    position: "Chief of Medicine",
    facility: "UCLA Medical Center",
    phone: "(555) 987-6543",
    email: "mchen@ucla.edu",
    relationship: "Attending Physician",
    yearsKnown: "2",
    status: "pending"
  }
];

// Verification Status Component
function VerificationStatus({ user }: { user: User }) {
  const getVerificationStatus = () => {
    if (user.isVerified) {
      return {
        status: "verified",
        color: "text-green-600",
        icon: CheckCircle,
        label: "Credentials Verified",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    }
    return {
      status: "pending",
      color: "text-orange-600",
      icon: Clock,
      label: "Credentials Under Review",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    };
  };

  const verification = getVerificationStatus();
  const IconComponent = verification.icon;

  return (
    <Alert className={`${verification.bgColor} ${verification.borderColor}`}>
      <IconComponent className={`h-4 w-4 ${verification.color}`} />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-medium ${verification.color}`}>
              {verification.label}
            </span>
            {user.verificationNotes && (
              <p className="text-sm text-gray-600 mt-1">{user.verificationNotes}</p>
            )}
          </div>
          <Badge variant={user.isVerified ? "default" : "secondary"}>
            {user.isVerified ? "Verified" : "Pending"}
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// License Information Section
function LicenseSection({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      licenseNumber: user.licenseNumber || "",
      licenseType: "RN - Registered Nurse",
      licenseState: "California",
      licenseExpiry: "2025-12-31",
      licenseStatus: "Active",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof licenseSchema>) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "License Information Updated",
        description: "Your license information has been updated successfully!",
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
        description: error.message || "Failed to update license information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof licenseSchema>) => {
    updateMutation.mutate(data);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Nursing License</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </CardHeader>
        <CardContent>
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
                        <Input {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select license type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LICENSE_TYPES.map((type) => (
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
                  name="licenseState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License State</FormLabel>
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
                  name="licenseExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
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
                {updateMutation.isPending ? "Saving..." : "Save License"}
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
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Nursing License</CardTitle>
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
            <p className="text-sm text-gray-600">License Number</p>
            <p className="font-medium">{user.licenseNumber || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">License Type</p>
            <p className="font-medium">RN - Registered Nurse</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">State</p>
            <p className="font-medium">California</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Expiry Date</p>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">December 31, 2025</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Active License</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Certifications Section
function CertificationsSection({ user }: { user: User }) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      certificationName: "",
      certificationNumber: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
    },
  });

  const addCertificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof certificationSchema>) => {
      // In real app, this would add to certifications array
      console.log("Adding certification:", data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Certification Added",
        description: "Your certification has been added successfully!",
      });
      setIsAddingNew(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof certificationSchema>) => {
    addCertificationMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Award className="h-5 w-5 text-blue-600" />
          <CardTitle>Certifications</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Certification
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCertifications.map((cert) => (
            <div key={cert.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{cert.name}</h4>
                <Badge variant={cert.status === "verified" ? "default" : "secondary"}>
                  {cert.status === "verified" ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                <div>Number: {cert.number}</div>
                <div>Organization: {cert.organization}</div>
                <div>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}

          {isAddingNew && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-4">Add New Certification</h4>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="certificationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Name</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select certification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CERTIFICATION_TYPES.map((type) => (
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
                      name="certificationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certification Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="issuingOrganization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Organization</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} type="date" />
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
                            <Input {...field} type="date" />
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

// Education Section Component
function EducationSection({ user }: { user: User }) {
  const [showAddForm, setShowAddForm] = useState(false);

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

  const onSubmit = (data: any) => {
    console.log("Education data:", data);
    setShowAddForm(false);
    form.reset();
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
        {mockEducation.map((education) => (
          <div key={education.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{education.degree}</h3>
                <p className="text-sm text-muted-foreground">{education.institution}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-muted-foreground">
                    Graduated: {education.graduationYear}
                  </span>
                  {education.gpa && (
                    <span className="text-sm text-muted-foreground">
                      GPA: {education.gpa}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={education.status === 'verified' ? 'default' : 'secondary'}>
                  {education.status === 'verified' ? (
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
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

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
                  <Button type="submit">Save Education</Button>
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
function ExperienceSection({ user }: { user: User }) {
  const [showAddForm, setShowAddForm] = useState(false);

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

  const onSubmit = (data: any) => {
    console.log("Experience data:", data);
    setShowAddForm(false);
    form.reset();
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
        {mockExperience.map((experience) => (
          <div key={experience.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{experience.position}</h3>
                <p className="text-sm text-muted-foreground font-medium">{experience.facilityName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(experience.startDate).toLocaleDateString()} - {new Date(experience.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{experience.responsibilities}</p>
                <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                  <p className="font-medium">Contact Reference:</p>
                  <p>{experience.contactPerson}</p>
                  <p>{experience.contactPhone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={experience.status === 'verified' ? 'default' : 'secondary'}>
                  {experience.status === 'verified' ? (
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
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

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
                  <Button type="submit">Save Experience</Button>
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
function ReferencesSection({ user }: { user: User }) {
  const [showAddForm, setShowAddForm] = useState(false);

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

  const onSubmit = (data: any) => {
    console.log("Reference data:", data);
    setShowAddForm(false);
    form.reset();
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
        {mockReferences.map((reference) => (
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
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

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
                  <Button type="submit">Save Reference</Button>
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

// Document Upload Section
function DocumentsSection({ user }: { user: User }) {
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: "Nursing_License.pdf", type: "License", uploadDate: "2024-01-15", status: "verified" },
    { id: 2, name: "BLS_Certificate.pdf", type: "Certification", uploadDate: "2024-01-20", status: "verified" },
    { id: 3, name: "Resume.pdf", type: "Resume", uploadDate: "2024-02-01", status: "pending" },
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In real app, upload files to server
      const newFiles = Array.from(files).map((file, index) => ({
        id: uploadedFiles.length + index + 1,
        name: file.name,
        type: "Document",
        uploadDate: new Date().toISOString().split('T')[0],
        status: "pending"
      }));
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
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
            <Upload className="h-4 w-4 mr-1" />
            Upload Documents
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {file.type} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={file.status === "verified" ? "default" : "secondary"}>
                  {file.status === "verified" ? "Verified" : "Pending"}
                </Badge>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Nurse Credentials Component
export default function NurseCredentials({ user }: NurseCredentialsProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Credentials & Verification</h1>
      
      <div className="space-y-6">
        <VerificationStatus user={user} />
        
        <Tabs defaultValue="license" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="license" className="space-y-6">
            <LicenseSection user={user} />
          </TabsContent>
          
          <TabsContent value="certifications" className="space-y-6">
            <CertificationsSection user={user} />
          </TabsContent>
          
          <TabsContent value="education" className="space-y-6">
            <EducationSection user={user} />
          </TabsContent>
          
          <TabsContent value="experience" className="space-y-6">
            <ExperienceSection user={user} />
          </TabsContent>
          
          <TabsContent value="references" className="space-y-6">
            <ReferencesSection user={user} />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <DocumentsSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}