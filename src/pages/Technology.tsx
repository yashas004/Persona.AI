import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Shield, Database, Network, Code, ArrowRight, CheckCircle } from "lucide-react";

const Technology = () => {
  const technologies = [
    {
      icon: Cpu,
      title: "MediaPipe",
      description: "Google's cutting-edge computer vision framework optimized for real-time processing in web browsers.",
      features: [
        "Face Mesh: 468 facial landmarks for precise expression analysis",
        "Pose Estimation: 33-point body pose tracking",
        "Hand Tracking: Real-time gesture recognition",
        "Optimized for WebAssembly and WebGL acceleration"
      ],
      specs: {
        "Processing Speed": "< 30ms per frame",
        "Model Size": "~2-5MB compressed",
        "Accuracy": "95%+ landmark detection",
        "Platform": "Cross-browser compatible"
      }
    },
    {
      icon: Network,
      title: "Web Audio API",
      description: "Browser-native audio processing engine for real-time voice analysis and quality assessment.",
      features: [
        "YIN Algorithm: Fundamental frequency detection for pitch analysis",
        "SNR Calculation: Signal-to-noise ratio for clarity assessment",
        "FFT Analysis: Frequency domain processing for voice characteristics",
        "Real-time audio feature extraction"
      ],
      specs: {
        "Sample Rate": "44.1kHz - 48kHz",
        "Latency": "< 10ms",
        "Frequency Range": "20Hz - 20kHz",
        "Dynamic Range": "90dB+"
      }
    },
    {
      icon: Database,
      title: "TensorFlow.js",
      description: "Machine learning runtime optimized for web browsers with hardware acceleration support.",
      features: [
        "Emotion Recognition: 7+ emotion categories with confidence scoring",
        "Gesture Classification: Advanced pattern recognition",
        "Content Analysis: Natural language processing capabilities",
        "WebGL & WASM acceleration for optimal performance"
      ],
      specs: {
        "Inference Speed": "< 50ms per inference",
        "Memory Usage": "50-200MB depending on models",
        "Accuracy": "90%+ classification accuracy",
        "Backend Support": "WebGL, WASM, CPU"
      }
    },
    {
      icon: Code,
      title: "Natural Language Processing",
      description: "Advanced text analysis engine for content quality assessment and coherence evaluation.",
      features: [
        "TF-IDF Analysis: Term frequency-inverse document frequency weighting",
        "Sentiment Analysis: VADER algorithm for emotion detection in text",
        "Named Entity Recognition: Pattern-based entity extraction",
        "Readability Scoring: Automated readability assessment"
      ],
      specs: {
        "Processing Speed": "< 5ms per analysis",
        "Language Support": "English, Hindi, Telugu",
        "Accuracy": "85%+ sentiment detection",
        "Memory Footprint": "< 1MB"
      }
    }
  ];

  const performanceMetrics = [
    {
      metric: "Response Time",
      value: "< 100ms",
      description: "End-to-end analysis latency from capture to display",
      icon: Zap
    },
    {
      metric: "Accuracy",
      value: "95%+",
      description: "Industry-leading recognition and analysis accuracy",
      icon: CheckCircle
    },
    {
      metric: "Privacy",
      value: "100%",
      description: "All processing happens locally in your browser",
      icon: Shield
    },
    {
      metric: "Compatibility",
      value: "98%",
      description: "Works on 98% of modern web browsers",
      icon: Network
    }
  ];

  const architecture = [
    {
      layer: "Input Layer",
      description: "Camera and microphone capture with WebRTC",
      technologies: ["getUserMedia API", "MediaStream API", "WebRTC"]
    },
    {
      layer: "Processing Layer",
      description: "Real-time AI analysis with optimized models",
      technologies: ["MediaPipe", "TensorFlow.js", "Web Audio API"]
    },
    {
      layer: "Analysis Layer",
      description: "Multi-modal fusion and scoring algorithms",
      technologies: ["Custom ML Models", "Statistical Analysis", "Rule-based Systems"]
    },
    {
      layer: "Output Layer",
      description: "Real-time feedback and visualization",
      technologies: ["Canvas API", "WebGL", "CSS Animations"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Technology Stack
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built with cutting-edge AI technologies for real-time, privacy-first communication analysis
          </p>
        </div>
      </section>

      {/* Core Technologies */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Core AI Technologies
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our system combines multiple state-of-the-art AI frameworks for comprehensive analysis
            </p>
          </div>

          <div className="space-y-12">
            {technologies.map((tech, index) => (
              <Card key={index} className="p-8 bg-gradient-card border-border">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Header */}
                  <div className="md:col-span-1">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <tech.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-foreground">{tech.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{tech.description}</p>
                  </div>

                  {/* Features */}
                  <div className="md:col-span-1">
                    <h4 className="font-semibold mb-3 text-foreground">Key Features:</h4>
                    <ul className="space-y-2">
                      {tech.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specs */}
                  <div className="md:col-span-1">
                    <h4 className="font-semibold mb-3 text-foreground">Technical Specs:</h4>
                    <div className="space-y-2">
                      {Object.entries(tech.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              System Architecture
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Multi-layered architecture ensuring optimal performance and real-time analysis
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {architecture.map((layer, index) => (
              <div key={index} className="flex items-center gap-6 mb-8">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <Card className="flex-1 p-6 bg-background border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-foreground">{layer.layer}</h3>
                      <p className="text-sm text-muted-foreground">{layer.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {layer.technologies.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Performance Metrics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry-leading performance with real-time analysis capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {performanceMetrics.map((metric, index) => (
              <Card key={index} className="p-6 bg-gradient-card border-border text-center">
                <metric.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
                <div className="text-sm font-semibold text-foreground mb-2">{metric.metric}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Experience the Technology
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            See our advanced AI system in action with real-time analysis and feedback
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/practice'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4"
            >
              Try It Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.href = '/features'}
              className="border-border hover:bg-secondary px-8 py-4"
            >
              View Features
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Technology;
