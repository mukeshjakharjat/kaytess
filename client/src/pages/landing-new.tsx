import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { Calendar, Users, Shield, Heart, Clock, MapPin, Award, CheckCircle, Moon, Sun, Stethoscope, ArrowRight } from "lucide-react";

export default function Landing() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">KAYTESS</span>
          </div>
          <div className="flex items-center gap-2">
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
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.location.href = "/auth"}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Mobile First */}
      <section className="px-4 py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Healthcare Staffing
                <span className="block text-primary">Made Simple</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect healthcare professionals with facilities in need. 
                Streamlined scheduling, competitive rates, and secure platform.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg h-12"
                onClick={() => window.location.href = "/auth"}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-3 text-lg h-12"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 md:py-16 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Why Choose KAYTESS?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built specifically for healthcare professionals and facilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Flexible Scheduling</h3>
                  <p className="text-muted-foreground">
                    Browse and apply for shifts that match your availability and preferences
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Secure & Compliant</h3>
                  <p className="text-muted-foreground">
                    HIPAA-compliant platform with robust security measures
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Competitive Pay</h3>
                  <p className="text-muted-foreground">
                    Earn competitive hourly rates for your nursing expertise
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Real-time Updates</h3>
                  <p className="text-muted-foreground">
                    Get instant notifications about new shifts and application status
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Location-based</h3>
                  <p className="text-muted-foreground">
                    Find shifts near you with detailed facility information
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card dark:bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-fit">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Professional Network</h3>
                  <p className="text-muted-foreground">
                    Connect with verified healthcare facilities and professionals
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of healthcare professionals already using KAYTESS
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg h-12"
            onClick={() => window.location.href = "/auth"}
          >
            Sign In to Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 bg-muted/30 dark:bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">KAYTESS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 KAYTESS. Healthcare staffing platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}