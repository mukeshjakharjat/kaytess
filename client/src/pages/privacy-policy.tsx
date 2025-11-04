import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <a href="/auth" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </a>
            </Button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              KAYTESS Healthcare Staffing Platform - Protecting Your Personal
              Information
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Welcome to KAYTESS, a healthcare staffing platform that connects
                qualified nurses with healthcare facilities. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our platform.
              </p>
              <p>
                As a healthcare technology platform, we are committed to
                maintaining the highest standards of privacy and security,
                including compliance with HIPAA (Health Insurance Portability
                and Accountability Act) and other applicable healthcare privacy
                laws.
              </p>
              <p>
                By using our services, you agree to the collection and use of
                information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle>2. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">2.1 Personal Information</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Name, email address, phone number, and physical address
                  </li>
                  <li>Professional credentials and licenses</li>
                  <li>Educational background and certifications</li>
                  <li>Work experience and employment history</li>
                  <li>References and background check information</li>
                  <li>
                    Banking and payment information for payroll processing
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  2.2 Healthcare Facility Information
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Facility name, address, and contact information</li>
                  <li>Operating licenses and certifications</li>
                  <li>Staffing needs and shift requirements</li>
                  <li>Facility policies and procedures</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2.3 Usage Information</h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Log files, IP addresses, and device information</li>
                  <li>Platform usage patterns and preferences</li>
                  <li>Communication records within the platform</li>
                  <li>Location data when using mobile features</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle>3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Facilitate connections between nurses and healthcare
                  facilities
                </li>
                <li>
                  Verify professional credentials and conduct background checks
                </li>
                <li>Process payments and manage billing</li>
                <li>
                  Communicate about shift opportunities and platform updates
                </li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Provide customer support and technical assistance</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>4. Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  We may share your information with:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>Healthcare Facilities:</strong> Relevant
                    professional information for staffing decisions
                  </li>
                  <li>
                    <strong>Service Providers:</strong> Third-party vendors who
                    assist with background checks, payment processing, and
                    platform operations
                  </li>
                  <li>
                    <strong>Legal Authorities:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Partners:</strong> With your consent, for
                    legitimate business purposes
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Important:</strong> We never sell your personal
                  information to third parties. All sharing is done in
                  accordance with healthcare privacy laws and with appropriate
                  safeguards.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* HIPAA Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>
                5. HIPAA Compliance and Healthcare Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                While KAYTESS is primarily a staffing platform, we recognize
                that healthcare information may be shared during the course of
                providing services. We maintain HIPAA-compliant practices
                including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Encryption of all data in transit and at rest</li>
                <li>Access controls and user authentication</li>
                <li>Regular security audits and assessments</li>
                <li>Staff training on privacy and security protocols</li>
                <li>Business associate agreements with third-party vendors</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle>6. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We implement comprehensive security measures to protect your
                information:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Advanced encryption for stored data</li>
                <li>Multi-factor authentication for user accounts</li>
                <li>
                  Regular security monitoring and incident response procedures
                </li>
                <li>Secure data centers with physical access controls</li>
                <li>Regular backup and disaster recovery procedures</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>7. Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Access:</strong> Request copies of your personal
                  information
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information (subject to legal requirements)
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data to
                  another service
                </li>
                <li>
                  <strong>Opt-out:</strong> Decline certain uses of your
                  information
                </li>
                <li>
                  <strong>Notification:</strong> Be informed of data breaches
                  affecting your information
                </li>
              </ul>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  To exercise these rights, please contact us using the
                  information provided at the end of this policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>8. Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Remember your login preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and features</li>
                <li>Ensure platform security</li>
              </ul>
              <p>
                You can control cookie settings through your browser
                preferences.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>9. Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p>We retain your information for as long as:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your account remains active</li>
                <li>Required to provide services to you</li>
                <li>Necessary to comply with legal obligations</li>
                <li>Required for legitimate business purposes</li>
              </ul>
              <p className="mt-4">
                Professional credentials and background check information may be
                retained for longer periods as required by healthcare
                regulations.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>10. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Your information may be processed in countries other than your
                own. We ensure appropriate safeguards are in place for
                international transfers, including standard contractual clauses
                and adequacy decisions where applicable.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>11. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Our services are not intended for individuals under 18 years of
                age. We do not knowingly collect personal information from
                children under 18. If we become aware that we have collected
                such information, we will take steps to delete it promptly.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>12. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date. For material
                changes, we may provide additional notice such as email
                notification.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>13. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-sm text-muted-foreground">
                      kaytesshift@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2024 KAYTESS Healthcare Staffing Platform. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This privacy policy is effective as of{" "}
              {new Date().toLocaleDateString()} and governs our collection, use,
              and disclosure of your information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
