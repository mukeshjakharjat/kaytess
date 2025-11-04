import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import type { ShiftWithDetails, ShiftApplication } from "@shared/schema";

interface ApplicationsReviewProps {
  shift: ShiftWithDetails;
  onApplicationAction?: (application: ShiftApplication, status: string, notes?: string) => void;
}

export default function ApplicationsReview({ shift, onApplicationAction }: ApplicationsReviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<ShiftApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: [`/api/shifts/${shift.id}/applications`],
    retry: false,
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { applicationId: number; status: string; notes?: string }) => {
      await apiRequest("PATCH", `/api/applications/${applicationId}`, {
        status,
        adminNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Updated",
        description: "The application status has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/shifts/${shift.id}/applications`] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
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
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const handleApplicationAction = (application: ShiftApplication, status: string) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  const confirmAction = (status: string) => {
    if (selectedApplication) {
      updateApplicationMutation.mutate({
        applicationId: selectedApplication.id,
        status,
        notes: adminNotes,
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Applications Review</span>
            <Badge variant="secondary" className="text-sm">
              {applications?.length || 0} applications
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nurse</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application: ShiftApplication) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-healthcare-blue rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {application.nurse?.firstName} {application.nurse?.lastName}
                          </div>
                          <div className="text-sm text-slate-500">
                            {application.nurse?.email}
                          </div>
                          {application.nurse?.licenseNumber && (
                            <div className="text-xs text-slate-400">
                              License: {application.nurse.licenseNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {new Date(application.appliedAt || "").toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {application.applicationNotes && (
                          <p className="text-sm text-slate-600 truncate">
                            {application.applicationNotes}
                          </p>
                        )}
                        {application.adminNotes && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            Admin: {application.adminNotes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-healthcare-green border-healthcare-green hover:bg-healthcare-green hover:text-white"
                            onClick={() => handleApplicationAction(application, "approved")}
                            disabled={updateApplicationMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                            onClick={() => handleApplicationAction(application, "rejected")}
                            disabled={updateApplicationMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {application.status !== "pending" && (
                        <span className="text-sm text-slate-500">
                          {application.respondedAt && 
                            `Reviewed ${new Date(application.respondedAt).toLocaleDateString()}`
                          }
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-600">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p>No applications yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Applications will appear here once nurses apply for this shift
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedApplication?.status === "approved" ? "Approve" : "Reject"} Application
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">
                Nurse ID: {selectedApplication?.nurseId}
              </p>
              {selectedApplication?.applicationNotes && (
                <div className="mt-2">
                  <Label className="text-sm font-medium">Application Notes:</Label>
                  <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded mt-1">
                    {selectedApplication.applicationNotes}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add any notes or feedback for the nurse..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => confirmAction("approved")}
                disabled={updateApplicationMutation.isPending}
                className="flex-1 bg-healthcare-green hover:bg-green-700"
              >
                {updateApplicationMutation.isPending ? "Processing..." : "Approve Application"}
              </Button>
              <Button
                onClick={() => confirmAction("rejected")}
                disabled={updateApplicationMutation.isPending}
                variant="destructive"
                className="flex-1"
              >
                {updateApplicationMutation.isPending ? "Processing..." : "Reject Application"}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}