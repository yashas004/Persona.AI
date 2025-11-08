import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Play, Users, Shield, Zap, TrendingUp } from "lucide-react";

const GetStarted = () => {
  const steps = [
    {
      step: 1,
      title: "Choose Your Path",
      description: "Select from different professional categories to get personalized AI coaching tailored to your needs.",
      icon: Users,
      details: [
        "Job interview preparation",
        "Business presentations",
        "Public speaking events",
        "Sales conversations",
        "Academic presentations"
      ]
    },
    {
      step: 2,
      title: "Grant Permissions",
      description: "Allow camera and microphone access for real-time analysis. All processing happens locally in your browser.",
      icon: Shield,
      details: [
        "Secure camera access",
        "Microphone permissions",
        "No data leaves your device",
        "Privacy-first approach"
      ]
    },
    {
      step: 3,
      title: "Start Practicing",
      description: "Begin your presentation and receive instant AI-powered feedback on your communication skills.",
      icon: Play,
      details: [
        "Real-time analysis",
        "Live feedback display",
        "Performance metrics",
        "Improvement suggestions"
      ]
    },
    {
      step: 4,
      title: "Review & Improve",
      description: "Get detailed analysis reports and track your progress over time with comprehensive insights.",
      icon: TrendingUp,
      details: [
        "Detailed performance reports",
        "Progress tracking",
        "Personalized recommendations",
        "Session recordings"
      ]
    }
  ];

  const features = [
    {
      icon: CheckCircle,
      title: "No Credit Card Required",
      description: "Start practicing immediately with our free tier. No payment information needed."
    },
    {
      icon: Shield,
      title: "100% Private & Secure",
      description: "All analysis happens in your browser. Your data never leaves your device."
    },
    {
      icon: Zap,
      title: "Real-Time Feedback",
      description: "Get instant feedback on your performance with sub-100ms response times."
    },
    {
      icon: TrendingUp,
      title: "Professional Coaching",
      description: "AI-powered analysis that rivals human communication coaches."
    }
  ];



  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Get Started Today
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your communication skills with AI-powered coaching. Start practicing for free in under 2 minutes.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = '/practice'}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
          >
            Start Free Practice
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Getting Started Steps */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              How to Get Started
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps to begin your AI-powered communication coaching journey
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start gap-6 mb-12">
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <Card className="flex-1 p-6 bg-gradient-card border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>

                      <div className="grid md:grid-cols-2 gap-2">
                        {step.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Why Choose Persona.AI?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of communication coaching with our advanced AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 bg-background border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the AI revolution in communication coaching. Start your free practice session now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/practice'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
            >
              Start Free Practice
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/features'}
              className="border-border hover:bg-secondary px-8 py-4 text-lg"
            >
              Learn More
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 100% free to start • Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GetStarted;
