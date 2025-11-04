import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  FileText,
  Trash2,
  UserX,
  Shield
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AdminUserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUserDetailsModal({ user, isOpen, onClose }: AdminUserDetailsModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Update verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        credentialsVerificationStatus: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Status updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update verification status.",
        variant: "destructive",
      });
    },
  });

  // Disable user mutation
  const disableUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("PATCH", `/api/users/${userId}`, {
        isActive: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User disabled",
        description: "User account has been disabled successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Disable failed",
        description: "Failed to disable user account.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User account has been permanently deleted.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete user account.",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user.role === 'nurse' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
            }`}>
              {user.role === 'nurse' ? 
                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" /> :
                <Building className="h-6 w-6 text-green-600 dark:text-green-400" />
              }
            </div>
            <div>
              <DialogTitle className="text-xl font-bold dark:text-white">
                {user.firstName} {user.lastName}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="capitalize dark:border-gray-600 dark:text-gray-300">
                  {user.role?.replace('_', ' ')}
                </Badge>
                <Badge className={getStatusColor(user.credentialsVerificationStatus || 'pending')}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(user.credentialsVerificationStatus || 'pending')}
                    <span className="capitalize">{user.credentialsVerificationStatus || 'pending'}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="dark:bg-gray-700 dark:border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 dark:text-white">
                  <UserIcon className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">{user.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">
                      Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">
                      Status: {user.isActive !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            {(user.address || user.city || user.state || user.zipCode) && (
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <MapPin className="h-5 w-5" />
                    <span>Address</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm dark:text-gray-300">
                    {user.address && <div>{user.address}</div>}
                    <div>
                      {user.city && `${user.city}, `}
                      {user.state && `${user.state} `}
                      {user.zipCode}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Role-specific Information */}
            {user.role === 'nurse' && (
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <FileText className="h-5 w-5" />
                    <span>Nursing Credentials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</label>
                      <p className="text-sm dark:text-gray-300">{user.licenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">License Type</label>
                      <p className="text-sm dark:text-gray-300">{user.licenseType || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Years of Experience</label>
                      <p className="text-sm dark:text-gray-300">{(user as any).nurseExperienceYears || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Specialties</label>
                      <p className="text-sm dark:text-gray-300">{(user as any).nurseSpecialties || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nursing Education</label>
                      <p className="text-sm dark:text-gray-300">{(user as any).nurseEducation || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Certifications</label>
                      <p className="text-sm dark:text-gray-300">{(user as any).nurseCertifications || 'Not provided'}</p>
                    </div>
                    {(user as any).nurseReferences && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Professional References</label>
                        <p className="text-sm dark:text-gray-300">{(user as any).nurseReferences}</p>
                      </div>
                    )}
                    {(user as any).bio && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio/Notes</label>
                        <p className="text-sm dark:text-gray-300">{(user as any).bio}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {user.role === 'nursing_home' && (
              <Card className="dark:bg-gray-700 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 dark:text-white">
                    <Building className="h-5 w-5" />
                    <span>Facility Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facility Name</label>
                      <p className="text-sm dark:text-gray-300">{user.facilityName || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Facility Type</label>
                      <p className="text-sm dark:text-gray-300">{user.facilityType || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">License Number</label>
                      <p className="text-sm dark:text-gray-300">{user.facilityLicenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</label>
                      <p className="text-sm dark:text-gray-300">{user.capacity || 'Not provided'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="space-x-2">
          <div className="flex items-center space-x-2 w-full justify-between">
            <div className="flex space-x-2">
              {user.credentialsVerificationStatus === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => updateVerificationMutation.mutate({ userId: user.id, status: 'verified' })}
                    disabled={updateVerificationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateVerificationMutation.mutate({ userId: user.id, status: 'rejected' })}
                    disabled={updateVerificationMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex space-x-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:border-yellow-500 dark:text-yellow-500 dark:hover:bg-yellow-900/20"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Disable
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-white">Disable User Account</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-gray-300">
                      This will disable the user account. The user will not be able to log in, but their data will be preserved. This action can be reversed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disableUserMutation.mutate(user.id)}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Disable
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-white">Delete User Account</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-gray-300">
                      This will permanently delete the user account and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}