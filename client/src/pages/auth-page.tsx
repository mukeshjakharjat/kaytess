import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Users, Clock, Shield, UserCheck, HelpCircle } from "lucide-react";
import { Redirect } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: `Logged in successfully as ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome to KAYTESS!",
        description: `Account created successfully for ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated && user) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-healthcare-green flex">
      {/* Left Side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to KAYTESS</h1>
            <p className="text-blue-100">Healthcare staffing made simple</p>
          </div>

          <Card className="bg-white/95 backdrop-blur">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="options">More Options</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nurse@example.com"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-medical-blue hover:bg-medical-blue/90"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="register">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join KAYTESS as a healthcare professional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="nurse@example.com"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Create a strong password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-medical-blue hover:bg-medical-blue/90"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="options">
                <CardHeader>
                  <CardTitle>Additional Options</CardTitle>
                  <CardDescription>
                    Access nurse registration, help, and support resources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full h-12 text-base font-medium border-2 hover:bg-blue-50"
                  >
                    <a href="/nurse-registration" className="flex items-center justify-center gap-3">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      <span>Sign Up as Nurse</span>
                    </a>
                  </Button>

                  <Button 
                    variant="outline" 
                    asChild 
                    className="w-full h-12 text-base font-medium border-2 hover:bg-green-50"
                  >
                    <a href="/help" className="flex items-center justify-center gap-3">
                      <HelpCircle className="w-5 h-5 text-green-600" />
                      <span>Help & Support</span>
                    </a>
                  </Button>

                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Healthcare Facility Registration
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact us at{" "}
                      <a 
                        href="mailto:kaytesshift@gmail.com" 
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        kaytesshift@gmail.com
                      </a>
                    </p>
                  </div>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
          {/* Quick Access Links - More Prominent */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Quick Access</h3>
              <p className="text-sm text-blue-100 mb-4">Need help or want to join as a nurse?</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                asChild 
                className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/40 py-3 text-base font-medium"
              >
                <a href="/nurse-registration" className="flex items-center justify-center gap-3">
                  <UserCheck className="w-5 h-5" />
                  <span>Sign Up as Nurse</span>
                </a>
              </Button>

              <Button 
                variant="outline" 
                asChild 
                className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/40 py-3 text-base font-medium"
              >
                <a href="/help" className="flex items-center justify-center gap-3">
                  <HelpCircle className="w-5 h-5" />
                  <span>Help & Support</span>
                </a>
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-xs text-blue-200">
                For facility registration, contact{" "}
                <a href="mailto:kaytesshift@gmail.com" className="underline hover:text-white font-medium">
                  kaytesshift@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="flex-1 bg-white/10 backdrop-blur-sm flex items-center justify-center p-8">
        <div className="text-center text-white space-y-8">
          <div className="flex justify-center">
            <Stethoscope className="h-16 w-16" />
          </div>
          <h2 className="text-4xl font-bold">Professional Healthcare Staffing</h2>
          <p className="text-xl text-blue-100 max-w-md">
            Connect qualified nurses with healthcare facilities in need. 
            Streamlined scheduling, secure credentials, and reliable placements.
          </p>

          <div className="grid grid-cols-1 gap-6 mt-8">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-blue-200" />
              <span className="text-blue-100">Verified Healthcare Professionals</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-200" />
              <span className="text-blue-100">Flexible Shift Scheduling</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-200" />
              <span className="text-blue-100">Secure Credential Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}