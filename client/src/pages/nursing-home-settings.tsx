import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import {
  VerificationSection,
  AccountSection,
  FacilitySection,
  LocationSection,
  ServicesSection,
  AboutSection
} from "@/components/nursing-home-profile-fixed";

export default function NursingHomeSettings() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="space-y-6">
        <VerificationSection user={user} />
        <AccountSection user={user} />
        <FacilitySection user={user} />
        <LocationSection user={user} />
        <ServicesSection user={user} />
        <AboutSection user={user} />
      </div>
    </div>
  );
}