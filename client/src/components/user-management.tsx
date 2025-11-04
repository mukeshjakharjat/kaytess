import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Edit2, Shield, Users, Trash2, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminUserDetailsModal from "@/components/admin-user-details-modal";
import type { User } from "@shared/schema";

export default function UserManagement() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      licenseNumber?: string;
      phoneNumber?: string;
      specialties?: string[];
    }) => {
      await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      await apiRequest("PATCH", `/api/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const specialtiesValue = formData.get("specialties") as string;
    const userData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: formData.get("role") as string,
      licenseNumber: formData.get("licenseNumber") as string || undefined,
      phoneNumber: formData.get("phoneNumber") as string || undefined,
      specialties: specialtiesValue ? specialtiesValue.split(',').map(s => s.trim()) : [],
      isActive: true,
    };
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      role: formData.get("role") as "admin" | "nurse" | "nursing_home",
      licenseNumber: formData.get("licenseNumber") as string || undefined,
      isActive: formData.get("isActive") === "true",
    };
    updateUserMutation.mutate({ id: editingUser.id, updates });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-medical-blue" />
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-medical-blue hover:bg-medical-blue/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="nursing_home">Nursing Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="(555) 123-4567" />
              </div>
              
              <div>
                <Label htmlFor="licenseNumber">License Number (Optional)</Label>
                <Input id="licenseNumber" name="licenseNumber" placeholder="RN12345" />
              </div>
              
              <div>
                <Label htmlFor="specialties">Specialties (Optional)</Label>
                <Input 
                  id="specialties" 
                  name="specialties" 
                  placeholder="ICU, Emergency, Pediatrics (comma-separated)"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="bg-medical-blue hover:bg-medical-blue/90"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input 
                    id="editFirstName" 
                    name="firstName" 
                    defaultValue={editingUser.firstName || ""} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input 
                    id="editLastName" 
                    name="lastName" 
                    defaultValue={editingUser.lastName || ""} 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select name="role" defaultValue={editingUser.role || "nurse"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="nursing_home">Nursing Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editLicenseNumber">License Number</Label>
                <Input 
                  id="editLicenseNumber" 
                  name="licenseNumber" 
                  defaultValue={editingUser.licenseNumber || ""} 
                />
              </div>
              
              <div>
                <Label htmlFor="editIsActive">Status</Label>
                <Select name="isActive" defaultValue={editingUser.isActive ? "true" : "false"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={updateUserMutation.isPending}
                  className="bg-medical-blue hover:bg-medical-blue/90"
                >
                  {updateUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users && Array.isArray(users) && (users as User[]).map((user: User) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-medical-blue text-white flex items-center justify-center font-semibold">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {user.licenseNumber && (
                      <p className="text-sm text-slate-500">License: {user.licenseNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className={user.role === "admin" ? "bg-purple-100 text-purple-800" : ""}
                  >
                    {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Badge>
                  
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Force fresh data fetch
                      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                      setSelectedUserForDetails(user);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
                        deleteUserMutation.mutate(user.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Details Modal */}
      <AdminUserDetailsModal
        user={selectedUserForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUserForDetails(null);
        }}
      />
    </div>
  );
}