import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  UserCheck, 
  Calendar, 
  Shield, 
  Award,
  FileText,
  Bell,
  CreditCard,
  Users,
  Building2,
  Settings,
  CheckCircle
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpPage() {
  const contactEmail = "kaytesshift@gmail.com";

  const faqItems = [
    {
      id: "registration",
      question: "How do I register as a nurse?",
      answer: "Click 'Sign Up as Nurse' on the homepage and complete the comprehensive registration form with your personal information, nursing credentials, education, experience, and references. Your application will be reviewed by our admin team."
    },
    {
      id: "approval",
      question: "How long does the approval process take?",
      answer: "The approval process typically takes 1-3 business days. Our admin team reviews your credentials, verifies your license, and may contact your references. You'll receive an email notification once approved."
    },
    {
      id: "shifts",
      question: "How do I find and apply for shifts?",
      answer: "Once approved, log into your dashboard and browse available shifts. You can filter by location, date, rate, and specialty. Click 'Apply' on shifts that match your availability and qualifications."
    },
    {
      id: "credentials",
      question: "What credentials do I need to provide?",
      answer: "You need a valid nursing license, current certifications (CPR, BLS, etc.), education details, work experience, and professional references. All documents are verified by our admin team."
    },
    {
      id: "payments",
      question: "How and when do I get paid?",
      answer: "Payments are processed after shift completion. Healthcare facilities pay the admin, who then processes payment to nurses. You can track payment status in your dashboard under 'My Shifts'."
    },
    {
      id: "notifications",
      question: "How do I receive notifications?",
      answer: "The system sends browser push notifications for shift updates, applications, and payments. Make sure to allow notifications when prompted. You'll also receive email notifications for important updates."
    },
    {
      id: "running-shifts",
      question: "How do I track my active shifts?",
      answer: "Use the 'My Shifts' tab in your dashboard to see active shifts with real-time hour tracking, start/end times, and payment status. The system automatically calculates hours worked."
    },
    {
      id: "support",
      question: "What if I need help or have issues?",
      answer: "Contact our admin team at kaytesshift@gmail.com for any assistance with your account, shifts, payments, or technical issues. We're here to help!"
    }
  ];

  const userGuides = [
    {
      title: "For Nurses",
      icon: UserCheck,
      steps: [
        "Complete comprehensive registration with credentials",
        "Wait for admin approval (1-3 business days)",
        "Browse and apply for available shifts",
        "Track active shifts and hours worked",
        "Receive notifications for updates and payments",
        "Manage your profile and credentials"
      ]
    },
    {
      title: "For Healthcare Facilities",
      icon: Building2,
      steps: [
        "Register your facility with admin approval",
        "Create and post shift requirements",
        "Review nurse applications and profiles",
        "Approve or reject applications",
        "Track shift progress and completion",
        "Process payments through admin system"
      ]
    },
    {
      title: "Admin Functions",
      icon: Shield,
      steps: [
        "Review and approve nurse registrations",
        "Verify healthcare facility credentials",
        "Monitor shift applications and assignments",
        "Manage payment processing flow",
        "Send system-wide notifications",
        "Provide user support and assistance"
      ]
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: "Shift Management",
      description: "Browse, apply, and track nursing shifts with real-time updates and notifications."
    },
    {
      icon: Shield,
      title: "Credential Verification",
      description: "Comprehensive verification of nursing licenses, certifications, and professional credentials."
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Real-time browser and email notifications for shift updates, approvals, and payments."
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Automatic shift time tracking with hour calculation and payment status monitoring."
    },
    {
      icon: CreditCard,
      title: "Payment Processing",
      description: "Secure payment flow from healthcare facilities through admin to nurses."
    },
    {
      icon: Users,
      title: "Multi-Role Support",
      description: "Dedicated dashboards for nurses, healthcare facilities, and admin users."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/auth" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Back to Login
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/privacy-policy" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </a>
              </Button>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Help & Support</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Welcome to KAYTESS Healthcare Staffing Platform. Find answers to common questions, 
            learn how to use the system, and get in touch with our support team.
          </p>
        </div>

        {/* Contact Information */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Admin Support
            </CardTitle>
            <CardDescription>
              Need assistance? Our admin team is here to help with any questions or issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-foreground">Email Support</p>
                  <a 
                    href={`mailto:${contactEmail}`}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {contactEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-foreground">Response Time</p>
                  <p className="text-muted-foreground">Within 24 hours</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button asChild>
                <a href={`mailto:${contactEmail}?subject=KAYTESS Support Request`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User Guides */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How to Use KAYTESS</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {userGuides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-sm rounded-full flex items-center justify-center">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Find quick answers to common questions about using KAYTESS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Registration Process */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Nurse Registration Process
            </CardTitle>
            <CardDescription>
              Step-by-step guide to joining KAYTESS as a healthcare professional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { step: 1, title: "Sign Up", description: "Complete registration form", icon: FileText },
                { step: 2, title: "Credentials", description: "Submit licensing & education", icon: Award },
                { step: 3, title: "Review", description: "Admin verification process", icon: Shield },
                { step: 4, title: "Approval", description: "Account activation", icon: CheckCircle },
                { step: 5, title: "Start Working", description: "Apply for shifts", icon: Calendar }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Important:</strong> All credentials are thoroughly verified by our admin team. 
                Please ensure all information is accurate and up-to-date to avoid delays in the approval process.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common actions and helpful links for KAYTESS users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center gap-2">
                <a href="/nurse-registration">
                  <UserCheck className="w-6 h-6" />
                  <span>Register as Nurse</span>
                </a>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center gap-2">
                <a href="/auth">
                  <Shield className="w-6 h-6" />
                  <span>Login</span>
                </a>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center gap-2">
                <a href={`mailto:${contactEmail}?subject=Account%20Support`}>
                  <Mail className="w-6 h-6" />
                  <span>Account Help</span>
                </a>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 flex flex-col items-center gap-2">
                <a href={`mailto:${contactEmail}?subject=Technical%20Support`}>
                  <HelpCircle className="w-6 h-6" />
                  <span>Technical Support</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}