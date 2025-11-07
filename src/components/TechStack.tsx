import { Code2, Cpu, Database, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const technologies = [
  {
    category: "Computer Vision",
    icon: Code2,
    items: ["MediaPipe", "OpenCV", "TensorFlow Lite"],
    color: "text-purple-400",
  },
  {
    category: "AI Models",
    icon: Cpu,
    items: ["Whisper ASR", "Llama 3.1", "Custom ML Pipeline"],
    color: "text-cyan-400",
  },
  {
    category: "Backend",
    icon: Database,
    items: ["FastAPI", "WebSocket", "Microservices"],
    color: "text-green-400",
  },
  {
    category: "Security",
    icon: Shield,
    items: ["Local Processing", "Encrypted Storage", "Self-Hosted"],
    color: "text-orange-400",
  },
];

const TechStack = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-secondary bg-clip-text text-transparent">
            Powered by Cutting-Edge Technology
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-level AI capabilities using open-source technologies for complete privacy and cost efficiency
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {technologies.map((tech, index) => (
            <Card
              key={index}
              className="p-6 bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 animate-fade-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <tech.icon className={`w-6 h-6 ${tech.color}`} />
                <h3 className="text-lg font-bold text-foreground">{tech.category}</h3>
              </div>
              <ul className="space-y-2">
                {tech.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${tech.color.replace('text-', 'bg-')}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 border border-accent/30">
            <Shield className="w-5 h-5 text-accent" />
            <span className="text-accent font-semibold">100% Privacy-First Architecture</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
