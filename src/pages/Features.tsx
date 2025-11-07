import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Brain, Mic, MessageSquare, Users, Eye, Target, Zap, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Facial Expression Analysis",
      description: "Advanced emotion detection, eye contact tracking, and micro-expression analysis powered by computer vision AI.",
      details: [
        "Real-time facial landmark detection (468 points)",
        "Emotion recognition with 7+ emotion categories",
        "Eye aspect ratio (EAR) calculations for blink detection",
        "Head pose estimation and gaze tracking"
      ],
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      icon: Mic,
      title: "Voice Quality Assessment",
      description: "Real-time analysis of tone, pace, volume, clarity, and filler word detection for professional speech delivery.",
      details: [
        "YIN algorithm for fundamental frequency detection",
        "Signal-to-noise ratio (SNR) analysis for clarity",
        "Volume normalization and dynamic range assessment",
        "Multi-language filler word detection"
      ],
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: MessageSquare,
      title: "Content Analysis",
      description: "Evaluate speech coherence, keyword usage, and engagement metrics using natural language processing.",
      details: [
        "TF-IDF keyword extraction and analysis",
        "Sentiment analysis with VADER algorithm",
        "Named entity recognition (NER)",
        "Readability scoring and coherence metrics"
      ],
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      icon: Users,
      title: "Body Language Evaluation",
      description: "Track posture, gestures, and movement patterns to enhance your non-verbal communication skills.",
      details: [
        "33-point pose estimation with MediaPipe",
        "Gesture recognition and hand tracking",
        "Posture analysis with joint angle calculations",
        "Movement stability and confidence scoring"
      ],
      gradient: "from-orange-500/20 to-red-500/20",
    },
  ];

  const additionalFeatures = [
    {
      icon: Eye,
      title: "Real-Time Feedback",
      description: "Get instant feedback on your performance with live metrics and actionable suggestions."
    },
    {
      icon: Target,
      title: "Personalized Coaching",
      description: "Tailored analysis for different professional contexts: interviews, presentations, sales, and more."
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Sub-100ms response times with optimized AI models running entirely in your browser."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "All processing happens locally - your data never leaves your device."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Powerful AI Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the comprehensive suite of AI-powered analysis tools that transform your communication skills
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Core Analysis Capabilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our multi-modal AI system analyzes every aspect of your presentation using state-of-the-art computer vision and audio processing
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-8 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <feature.icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground mb-3">Technical Details:</h4>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Additional Capabilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Beyond core analysis, enjoy these powerful features that enhance your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="p-6 bg-background border-border text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your AI-powered communication coaching journey today
          </p>
          <a
            href="/practice"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
          >
            Start Practicing Now
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
