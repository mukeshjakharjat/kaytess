import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  FileText, 
  Shield, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface NursingHomeCredentialsIntegratedProps {
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

function VerificationStatus({ user }: { user: User }) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "verified": return "text-green-600";
      case "rejected": return "text-red-600";
      default: return "text-yellow-600";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "verified": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected": return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Facility Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {getStatusIcon(user.credentialsVerificationStatus)}
          <div>
            <p className={`font-semibold ${getStatusColor(user.credentialsVerificationStatus)}`}>
              {user.credentialsVerificationStatus === "verified" ? "Verified" : 
               user.credentialsVerificationStatus === "rejected" ? "Verification Required" : "Pending Review"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user.credentialsVerificationStatus === "verified" 
                ? "Your facility credentials have been verified"
                : user.credentialsVerificationStatus === "rejected"
                ? "Please review and update your facility information"
                : "Your facility credentials are under review"}
            </p>
          </div>
        </div>
        {user.credentialsAdminNotes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Admin Notes:</p>
            <p className="text-sm text-muted-foreground">{user.credentialsAdminNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FacilityLicenseSection({ user }: { user: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    facilityLicense: user.facilityLicenseNumber || '',
    facilityType: user.facilityType || '',
    licenseState: user.state || ''
  });

  const { data: license } = useQuery({
    queryKey: ["/api/license"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/license");
      return await res.json();
    },
  });

  const updateLicenseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/license", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/license"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Facility license information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateLicenseMutation.mutate(formData);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility License Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="facilityLicense">Facility License Number</Label>
            <Input
              id="facilityLicense"
              value={formData.facilityLicense}
              onChange={(e) => setFormData(prev => ({ ...prev, facilityLicense: e.target.value }))}
              placeholder="Enter facility license number"
            />
          </div>

          <div>
            <Label htmlFor="facilityType">Facility Type</Label>
            <Select 
              value={formData.facilityType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, facilityType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="licenseState">Issuing State</Label>
            <Select 
              value={formData.licenseState} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, licenseState: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issuing state" />
              </SelectTrigger>
              <SelectContent>
                {usStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={updateLicenseMutation.isPending}
              size="sm"
            >
              {updateLicenseMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Facility License Information
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">License Number</p>
            <p className="font-medium">{license?.facilityLicense || user.facilityLicenseNumber || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Facility Type</p>
            <p className="font-medium">{license?.facilityType || user.facilityType || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Issuing State</p>
            <p className="font-medium">{license?.issuingState || user.state || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={license?.status === "verified" ? "default" : "secondary"}>
              {license?.status || "Pending"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccreditationsSection({ user }: { user: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    accreditationType: '',
    certificateNumber: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    status: 'pending'
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ["/api/certifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/certifications");
      return await res.json();
    },
  });

  const addCertificationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("POST", "/api/certifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setIsAdding(false);
      setFormData({
        accreditationType: '',
        certificateNumber: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        status: 'pending'
      });
      toast({
        title: "Success",
        description: "Accreditation added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCertificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      await apiRequest("PUT", `/api/certifications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      setEditingId(null);
      toast({
        title: "Success",
        description: "Accreditation updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/certifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certifications"] });
      toast({
        title: "Success",
        description: "Accreditation deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (editingId) {
      updateCertificationMutation.mutate({ id: editingId, data: formData });
    } else {
      addCertificationMutation.mutate(formData);
    }
  };

  const startEdit = (cert: any) => {
    setFormData({
      accreditationType: cert.accreditationType || cert.name || '',
      certificateNumber: cert.certificateNumber || cert.number || '',
      issuingOrganization: cert.issuingOrganization || cert.organization || '',
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      status: cert.status || 'pending'
    });
    setEditingId(cert.id);
  };

  if (isAdding || editingId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {editingId ? "Edit Accreditation" : "Add Accreditation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accreditationType">Accreditation Type</Label>
            <Select 
              value={formData.accreditationType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, accreditationType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select accreditation type" />
              </SelectTrigger>
              <SelectContent>
                {accreditationTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certificateNumber">Certificate Number</Label>
            <Input
              id="certificateNumber"
              value={formData.certificateNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
              placeholder="Enter certificate number"
            />
          </div>

          <div>
            <Label htmlFor="issuingOrganization">Issuing Organization</Label>
            <Input
              id="issuingOrganization"
              value={formData.issuingOrganization}
              onChange={(e) => setFormData(prev => ({ ...prev, issuingOrganization: e.target.value }))}
              placeholder="Enter issuing organization"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={addCertificationMutation.isPending || updateCertificationMutation.isPending}
              size="sm"
            >
              {(addCertificationMutation.isPending || updateCertificationMutation.isPending) ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({
                  accreditationType: '',
                  certificateNumber: '',
                  issuingOrganization: '',
                  issueDate: '',
                  expiryDate: '',
                  status: 'pending'
                });
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Facility Accreditations
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certifications.map((cert: any) => (
            <div key={cert.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{cert.accreditationType || cert.name}</h4>
                    <Badge variant={cert.status === "verified" ? "default" : "secondary"}>
                      {cert.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Certificate: {cert.certificateNumber || cert.number || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Issued by: {cert.issuingOrganization || cert.organization || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valid: {cert.issueDate || "N/A"} - {cert.expiryDate || "N/A"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(cert)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCertificationMutation.mutate(cert.id)}
                    disabled={deleteCertificationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {certifications.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No accreditations added yet. Click the + button to add your first accreditation.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NursingHomeCredentialsIntegrated({ user }: NursingHomeCredentialsIntegratedProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Facility Credentials</h2>
          <p className="text-muted-foreground">Manage your facility licensing and accreditation information</p>
        </div>
      </div>

      <VerificationStatus user={user} />
      <FacilityLicenseSection user={user} />
      <AccreditationsSection user={user} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Required Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              "Valid facility operating license",
              "Medicare/Medicaid certification", 
              "State health department approval",
              "Liability insurance documentation",
              "Administrator credentials verification",
              "Facility accreditation certificates",
              "Fire safety and building code compliance",
              "Background checks for key personnel"
            ].map((requirement, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{requirement}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}