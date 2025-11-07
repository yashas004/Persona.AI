import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Brain, BarChart3, ArrowRight, CheckCircle, Play, Users, Zap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      icon: Camera,
      title: "Setup & Access",
      description: "Grant camera and microphone permissions for real-time analysis. All processing happens locally in your browser.",
      details: [
        "One-click camera access",
        "Microphone permission for audio analysis",
        "No data leaves your device",
        "Works offline after initial load"
      ]
    },
    {
      icon: Users,
      title: "Choose Your Context",
      description: "Select from different professional scenarios to get personalized AI coaching tailored to your needs.",
      details: [
        "Job interviews preparation",
        "Business presentations",
        "Public speaking events",
        "Sales conversations",
        "Remote work scenarios"
      ]
    },
    {
      icon: Play,
      title: "Start Recording",
      description: "Begin your presentation or practice session. Our AI immediately starts analyzing your performance in real-time.",
      details: [
        "Live video feed with overlays",
        "Real-time metrics display",
        "Instant feedback generation",
        "Multi-language support"
      ]
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Advanced algorithms process your facial expressions, voice, content, and body language simultaneously.",
      details: [
        "468-point facial landmark detection",
        "Emotion recognition & sentiment analysis",
        "Speech pattern analysis",
        "Gesture and posture evaluation"
      ]
    },
    {
      icon: BarChart3,
      title: "Receive Feedback",
      description: "Get comprehensive analysis with scores, insights, and actionable recommendations for improvement.",
      details: [
        "Detailed performance metrics",
        "Personalized improvement suggestions",
        "Progress tracking over time",
        "Session recording and review"
      ]
    }
  ];

  const technologies = [
    {
      name: "MediaPipe",
      description: "Google's computer vision framework for real-time face and pose detection",
      features: ["Face Mesh (468 landmarks)", "Pose Estimation (33 points)", "Hand Tracking", "Real-time processing"]
    },
    {
      name: "Web Audio API",
      description: "Browser-native audio processing for voice analysis",
      features: ["Pitch detection (YIN)", "Volume analysis", "SNR calculations", "Real-time audio features"]
    },
    {
      name: "TensorFlow.js",
      description: "Machine learning in the browser for advanced AI processing",
      features: ["Emotion recognition", "Gesture classification", "Content analysis", "Performance optimization"]
    },
    {
      name: "Natural Language Processing",
      description: "Text analysis for content quality and coherence assessment",
      features: ["TF-IDF analysis", "Sentiment detection", "Readability scoring", "Keyword extraction"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            How It Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the power of AI-driven communication coaching in just a few simple steps
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Your AI Coaching Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From setup to insights - see how our intelligent system transforms your communication skills
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center gap-8 mb-16">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
                      {step.step}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-16 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-border"></div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <Card className="flex-1 p-8 bg-gradient-card border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3 text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">{step.description}</p>

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

      {/* Technology Section */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our system combines multiple cutting-edge technologies for comprehensive analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {technologies.map((tech, index) => (
              <Card key={index} className="p-6 bg-background border-border">
                <h3 className="text-xl font-bold mb-3 text-foreground">{tech.name}</h3>
                <p className="text-muted-foreground mb-4">{tech.description}</p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tech.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Lightning Fast Performance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience real-time AI analysis with industry-leading performance metrics
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-card border-border text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold text-primary mb-2">&lt;100ms</div>
              <div className="text-lg font-semibold text-foreground mb-2">Response Time</div>
              <p className="text-sm text-muted-foreground">Real-time analysis with minimal latency</p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border text-center">
              <Brain className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold text-primary mb-2">95%+</div>
              <div className="text-lg font-semibold text-foreground mb-2">Accuracy</div>
              <p className="text-sm text-muted-foreground">Industry-leading recognition accuracy</p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-lg font-semibold text-foreground mb-2">Privacy</div>
              <p className="text-sm text-muted-foreground">All processing happens locally</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of communication coaching with our AI-powered platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/practice'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4"
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/features'}
              className="border-border hover:bg-secondary px-8 py-4"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;

