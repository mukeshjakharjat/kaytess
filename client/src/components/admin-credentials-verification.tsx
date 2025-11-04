import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Shield, 
  FileText, 
  Award,
  GraduationCap,
  Briefcase,
  Users,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface AdminCredentialsVerificationProps {
  user: UserType;
}

export default function AdminCredentialsVerification({ user }: AdminCredentialsVerificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNurse, setSelectedNurse] = useState<UserType | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Fetch nurses with pending credentials
  const { data: pendingNurses = [], isLoading } = useQuery({
    queryKey: ["/api/admin/pending-credentials"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pending-credentials");
      return await response.json();
    }
  });

  // Verify credentials mutation
  const verifyCredentialsMutation = useMutation({
    mutationFn: async ({ nurseId, status, notes }: { nurseId: string; status: string; notes?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/verify-credentials/${nurseId}`, {
        status,
        notes
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credentials Updated",
        description: "Nurse credentials verification status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-credentials"] });
      setSelectedNurse(null);
      setVerificationNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerification = (status: 'verified' | 'rejected') => {
    if (!selectedNurse) return;
    
    verifyCredentialsMutation.mutate({
      nurseId: selectedNurse.id,
      status,
      notes: verificationNotes
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Credentials Verification</h2>
          <p className="text-muted-foreground">Review and verify nurse credentials for platform access</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pendingNurses.length} Pending Reviews
        </Badge>
      </div>

      {pendingNurses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">No pending credential reviews at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nurses List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pending Reviews</h3>
            {pendingNurses.map((nurse: UserType) => (
              <Card 
                key={nurse.id} 
                className={`cursor-pointer transition-colors ${
                  selectedNurse?.id === nurse.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedNurse(nurse)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {nurse.firstName} {nurse.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground">{nurse.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {nurse.licenseNumber || "No License"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Verification Panel */}
          <div className="space-y-4">
            {selectedNurse ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Review Credentials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nurse Info */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">
                      {selectedNurse.firstName} {selectedNurse.lastName}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {selectedNurse.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedNurse.phoneNumber || "Not provided"}</p>
                      <p><span className="font-medium">License:</span> {selectedNurse.licenseNumber || "Not provided"}</p>
                      <p><span className="font-medium">State:</span> {selectedNurse.state || "Not provided"}</p>
                    </div>
                  </div>

                  {/* Credentials Overview */}
                  <Tabs defaultValue="license" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="license" className="text-xs">License</TabsTrigger>
                      <TabsTrigger value="certs" className="text-xs">Certs</TabsTrigger>
                      <TabsTrigger value="education" className="text-xs">Education</TabsTrigger>
                      <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
                      <TabsTrigger value="references" className="text-xs">References</TabsTrigger>
                    </TabsList>

                    <TabsContent value="license" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Nursing License</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>Number: {selectedNurse.licenseNumber || "Not provided"}</p>
                        <p>State: {selectedNurse.state || "Not provided"}</p>
                        <p>Status: Requires manual verification</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="certs" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Certifications</span>
                      </div>
                      <div className="text-sm">
                        <p><strong>Certifications:</strong> {selectedNurse.nurseCertifications || "Not provided"}</p>
                        <p className="text-muted-foreground mt-2">All certifications require document verification.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="education" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Education</span>
                      </div>
                      <div className="text-sm space-y-2">
                        <div>
                          <p><strong>Nursing Education:</strong> {selectedNurse.nurseEducation || "Not provided"}</p>
                        </div>
                        <p className="text-muted-foreground">Education credentials require verification.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Work Experience</span>
                      </div>
                      <div className="text-sm space-y-2">
                        <div>
                          <p><strong>Years of Experience:</strong> {selectedNurse.nurseExperienceYears || "Not provided"}</p>
                          <p><strong>Specialties:</strong> {selectedNurse.nurseSpecialties || "Not provided"}</p>
                        </div>
                        <p className="text-muted-foreground">Experience and specialties require verification.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="references" className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Professional References</span>
                      </div>
                      <div className="text-sm space-y-2">
                        <div>
                          <p><strong>References:</strong> {selectedNurse.nurseReferences || "Not provided"}</p>
                        </div>
                        <p className="text-muted-foreground">Professional references require direct contact verification.</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Verification Notes
                    </label>
                    <Textarea
                      placeholder="Add notes about the verification process, any issues found, or requirements..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleVerification('verified')}
                      disabled={verifyCredentialsMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {verifyCredentialsMutation.isPending ? "Verifying..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleVerification('rejected')}
                      disabled={verifyCredentialsMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {verifyCredentialsMutation.isPending ? "Processing..." : "Reject"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Nurse</h3>
                  <p className="text-muted-foreground">Choose a nurse from the list to review their credentials</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Information Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Nurses with pending or rejected credentials cannot apply for shifts. 
          Verify all documents and credentials thoroughly before approving access to the platform.
        </AlertDescription>
      </Alert>
    </div>
  );
}