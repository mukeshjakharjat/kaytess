import { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";
import { User } from "@shared/schema";

interface VerificationGuardProps {
  user: User;
  children: ReactNode;
  onRedirectToCredentials?: () => void;
}

export function VerificationGuard({ user, children, onRedirectToCredentials }: VerificationGuardProps) {
  // Check if user has pending credentials that need verification
  const hasUnverifiedCredentials = () => {
    // In real app, this would check actual credential verification status
    // For now, simulate based on user's verification status
    return user.credentialsVerificationStatus === 'pending' || 
           user.credentialsVerificationStatus === 'rejected' ||
           !user.credentialsVerificationStatus;
  };

  if (hasUnverifiedCredentials()) {
    return (
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="space-y-3">
              <div>
                <p className="font-semibold">Credentials Verification Required</p>
                <p className="text-sm mt-1">
                  Your nursing credentials are pending verification. You must complete and verify your credentials before applying for shifts.
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Required for verification:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Valid nursing license with state registration</li>
                  <li>Current BLS/CPR certification</li>
                  <li>Education transcripts and diplomas</li>
                  <li>Professional work experience verification</li>
                  <li>Professional references (minimum 2)</li>
                  <li>Background check completion</li>
                </ul>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={onRedirectToCredentials}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Complete Credentials Verification
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Disabled content overlay */}
        <div className="relative">
          <div className="pointer-events-none opacity-50 filter blur-sm">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="text-center p-6">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Verification Required
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Complete your credentials verification to access job applications
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default VerificationGuard;