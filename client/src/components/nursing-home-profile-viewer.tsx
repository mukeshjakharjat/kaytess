import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Phone, Mail, Globe, FileText, Award, CheckCircle, Shield, Eye } from "lucide-react";
import type { User } from "@shared/schema";

interface NursingHomeProfileViewerProps {
  nursingHomeId: string;
  trigger?: React.ReactNode;
}

export default function NursingHomeProfileViewer({ nursingHomeId, trigger }: NursingHomeProfileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: nursingHome, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${nursingHomeId}`],
    enabled: isOpen && !!nursingHomeId,
  });

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center space-x-2">
      <Eye className="h-4 w-4" />
      <span>View Nursing Home Profile</span>
    </Button>
  );

  if (!nursingHomeId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-healthcare-blue rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {nursingHome?.facilityName || "Nursing Home Profile"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {nursingHome?.facilityType ? nursingHome.facilityType.replace('_', ' ').toUpperCase() : "Healthcare Facility"}
              </p>
            </div>
            {nursingHome?.isVerified ? (
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
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-healthcare-blue mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading facility information...</p>
          </div>
        ) : nursingHome ? (
          <div className="space-y-6 p-1">
            {/* Facility Information */}
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
                    <p className="text-foreground">{nursingHome.facilityName || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Facility Type</Label>
                    <p className="text-foreground">
                      {nursingHome.facilityType ? nursingHome.facilityType.replace('_', ' ').toUpperCase() : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">License Number</Label>
                    <p className="text-foreground">{nursingHome.facilityLicenseNumber || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Bed Capacity</Label>
                    <p className="text-foreground">{nursingHome.capacity || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
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
                    {nursingHome.address && nursingHome.city && nursingHome.state 
                      ? `${nursingHome.address}, ${nursingHome.city}, ${nursingHome.state} ${nursingHome.zipCode || ""}`
                      : "Not specified"
                    }
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-foreground flex items-center">
                      {nursingHome.facilityPhone ? (
                        <>
                          <Phone className="h-4 w-4 mr-2" />
                          <a href={`tel:${nursingHome.facilityPhone}`} className="text-blue-600 hover:underline">
                            {nursingHome.facilityPhone}
                          </a>
                        </>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-foreground flex items-center">
                      {nursingHome.facilityEmail ? (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          <a href={`mailto:${nursingHome.facilityEmail}`} className="text-blue-600 hover:underline">
                            {nursingHome.facilityEmail}
                          </a>
                        </>
                      ) : (
                        "Not specified"
                      )}
                    </p>
                  </div>
                </div>
                {nursingHome.website && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                    <p className="text-foreground flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={nursingHome.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {nursingHome.website}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certification & Administration */}
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
                      {nursingHome.adminName ? `${nursingHome.adminName}${nursingHome.adminTitle ? `, ${nursingHome.adminTitle}` : ""}` : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Established</Label>
                    <p className="text-foreground">{nursingHome.establishedYear || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {nursingHome.medicaidCertified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Medicaid Certified
                      </Badge>
                    )}
                    {nursingHome.medicareCertified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Medicare Certified
                      </Badge>
                    )}
                    {!nursingHome.medicaidCertified && !nursingHome.medicareCertified && (
                      <p className="text-muted-foreground text-sm">No certifications listed</p>
                    )}
                  </div>
                </div>
                {nursingHome.emergencyContact && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                    <p className="text-foreground">{nursingHome.emergencyContact}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description & Services */}
            {(nursingHome.description || nursingHome.servicesOffered) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    About Our Facility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nursingHome.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-foreground mt-1 leading-relaxed">{nursingHome.description}</p>
                    </div>
                  )}
                  {nursingHome.servicesOffered && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Services Offered</Label>
                      <p className="text-foreground mt-1 leading-relaxed">{nursingHome.servicesOffered}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Unable to load facility information.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}