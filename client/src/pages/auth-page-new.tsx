import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { Heart, Shield, Moon, Sun, Stethoscope, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Redirect if already authenticated
  if (user) {
    setLocation("/");
    return null;
  }

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: async (userData) => {
      // Invalidate and refetch user data to trigger auth state update
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Login successful",
        description: "Welcome back to KAYTESS!",
      });
      
      // Small delay to ensure auth state is updated before redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background flex flex-col">
      {/* Header with theme toggle */}
      <div className="flex justify-between items-center p-4 md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Login Form - Mobile First */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Welcome to KAYTESS</h1>
              <p className="text-muted-foreground">
                Sign in to your healthcare staffing account
              </p>
            </div>

            <Card className="border-border">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="nurse@example.com"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                    
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setLocation("/forgot-password")}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </Form>

                <div className="mt-6 text-center space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/nurse-registration")}
                      className="flex-1 sm:flex-none"
                    >
                      Sign Up as Nurse
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setLocation("/help")}
                      className="flex-1 sm:flex-none"
                    >
                      Need Help?
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For nursing home accounts, contact admin at kaytesshift@gmail.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hero Section - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex lg:flex-1 bg-primary/5 dark:bg-primary/10 items-center justify-center p-12">
          <div className="max-w-md text-center space-y-6">
            <div className="space-y-4">
              <Heart className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-3xl font-bold text-foreground">
                Healthcare Staffing Made Simple
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect healthcare professionals with facilities in need. 
                Streamlined scheduling, competitive rates, and secure platform.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Secure & Compliant</h3>
                  <p className="text-sm text-muted-foreground">HIPAA-compliant platform</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Professional Network</h3>
                  <p className="text-sm text-muted-foreground">Connect with verified facilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}