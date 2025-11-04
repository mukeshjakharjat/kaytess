import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Star, Users, Calendar, DollarSign, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WelcomeStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "upcoming";
}

export default function NurseWelcomeDashboard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  const welcomeSteps: WelcomeStep[] = [
    {
      id: 1,
      title: "Registration Submitted",
      description: "Your application has been successfully submitted to our admin team.",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      status: "completed"
    },
    {
      id: 2,
      title: "Under Review",
      description: "Our team is currently reviewing your credentials and documentation.",
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      status: "current"
    },
    {
      id: 3,
      title: "Verification Complete",
      description: "Your credentials will be verified and your account will be activated.",
      icon: <Award className="h-6 w-6 text-purple-500" />,
      status: "upcoming"
    },
    {
      id: 4,
      title: "Start Working",
      description: "Browse and apply for shifts that match your expertise and schedule.",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      status: "upcoming"
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      title: "Competitive Pay",
      description: "Earn $25-45/hour based on your experience and specialization"
    },
    {
      icon: <Calendar className="h-8 w-8 text-blue-500" />,
      title: "Flexible Schedule",
      description: "Choose shifts that fit your lifestyle and availability"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-500" />,
      title: "Premium Facilities",
      description: "Work at top-rated healthcare facilities in your area"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const celebrationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Star className="h-10 w-10 text-white" />
            </motion.div>
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Welcome to KAYTESS! 🎉
          </motion.h1>
          
          <motion.p 
            className="text-lg text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            Thank you for joining our healthcare staffing platform
          </motion.p>
        </motion.div>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              variants={celebrationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-6xl">🎊</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Steps */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="p-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Application Progress
              </CardTitle>
              <CardDescription>
                Track your registration status and next steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {welcomeSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.2 }}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      step.status === "current"
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : step.status === "completed"
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        step.status === "completed"
                          ? "default"
                          : step.status === "current"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {step.status === "completed"
                        ? "Done"
                        : step.status === "current"
                        ? "In Progress"
                        : "Pending"}
                    </Badge>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span>Overall Progress</span>
                  <span>25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Cards */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Why You'll Love Working with KAYTESS
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 + index * 0.3 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                }}
                className="cursor-pointer"
              >
                <Card className="h-full text-center p-6 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="pt-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="mx-auto mb-4"
                    >
                      {benefit.icon}
                    </motion.div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">What Happens Next?</h3>
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <span>Admin team reviews your application (24-48 hours)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <span>Email notification when account is approved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <span>Complete your profile and start applying for shifts</span>
                  </div>
                </div>
                
                <motion.div 
                  className="mt-6"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => window.location.href = "/help"}
                  >
                    Questions? Visit Help Center
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-8 text-gray-500 dark:text-gray-400"
        >
          <p className="text-sm">
            Need immediate assistance? Contact us at{" "}
            <a 
              href="mailto:kaytesshift@gmail.com" 
              className="text-blue-500 hover:underline font-medium"
            >
              kaytesshift@gmail.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}