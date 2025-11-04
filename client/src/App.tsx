import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/auth-page-new";
import NurseDashboard from "@/pages/nurse-dashboard";
import AdminDashboard from "@/pages/admin-dashboard-mobile";
import NursingHomeDashboard from "@/pages/nursing-home-dashboard";
import NurseRegistration from "@/pages/nurse-registration";
import NurseWelcomeDashboard from "@/pages/nurse-welcome-dashboard";
import HelpPage from "@/pages/help-page";
import PrivacyPolicy from "@/pages/privacy-policy";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import NotFound from "@/pages/not-found";



function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={AuthPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/nurse-registration" component={NurseRegistration} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/help" component={HelpPage} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
        </>
      ) : (
        <>
          <Route path="/" component={() => {
            const role = (user as any)?.role;
            const status = (user as any)?.status;
            
            if (role === "admin") return <AdminDashboard />;
            if (role === "nursing_home") return <NursingHomeDashboard />;
            if (role === "nurse" && status === "pending") return <NurseWelcomeDashboard />;
            return <NurseDashboard />;
          }} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/nurse" component={NurseDashboard} />
          <Route path="/nurse-welcome" component={NurseWelcomeDashboard} />
          <Route path="/nursing-home" component={NursingHomeDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="kaytess-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
