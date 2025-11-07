import { Brain, Mic, MessageSquare, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Facial Expression Analysis",
    description: "Advanced emotion detection, eye contact tracking, and micro-expression analysis powered by computer vision AI.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Mic,
    title: "Voice Quality Assessment",
    description: "Real-time analysis of tone, pace, volume, clarity, and filler word detection for professional speech delivery.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: MessageSquare,
    title: "Content Analysis",
    description: "Evaluate speech coherence, keyword usage, and engagement metrics using natural language processing.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: Users,
    title: "Body Language Evaluation",
    description: "Track posture, gestures, and movement patterns to enhance your non-verbal communication skills.",
    gradient: "from-orange-500/20 to-red-500/20",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            AI-Powered Analysis Engine
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Multi-modal AI technology that provides comprehensive feedback on every aspect of your presentation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
