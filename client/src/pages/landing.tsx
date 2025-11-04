import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="text-medical-blue text-2xl mr-3 h-8 w-8" />
              <h1 className="text-xl font-semibold text-slate-900">KAYTESS</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-medical-blue hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            KAYTESS
            <span className="text-medical-blue block">Nursing Shift Platform</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Find flexible nursing shifts that match your schedule and specialties. 
            Apply for shifts with competitive hourly rates at top healthcare facilities.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-medical-blue hover:bg-blue-700 text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            For Nurses: Find Your Perfect Shift
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 text-medical-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Flexible Scheduling</h3>
                <p className="text-slate-600">Browse and apply for shifts that match your availability and preferences</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-medical-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Competitive Pay</h3>
                <p className="text-slate-600">Earn competitive hourly rates for your nursing expertise and experience</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-medical-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure Platform</h3>
                <p className="text-slate-600">HIPAA-compliant system with robust security measures</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Heart className="h-12 w-12 text-medical-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Patient Care</h3>
                <p className="text-slate-600">Focus on patient care while we handle the staffing logistics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-medical-blue">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Healthcare Staffing?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of healthcare professionals using KAYTESS
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-medical-blue hover:bg-slate-100 text-lg px-8 py-3"
          >
            Sign In Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-6 w-6 text-medical-blue mr-2" />
            <span className="text-lg font-semibold">KAYTESS</span>
          </div>
          <p className="text-slate-400">
            Professional healthcare shift management system
          </p>
        </div>
      </footer>
    </div>
  );
}
