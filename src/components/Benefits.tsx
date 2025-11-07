import { Target, Zap, Lock, DollarSign, TrendingUp, Users } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "95%+ Accuracy",
    description: "Industry-leading precision in emotion and speech recognition",
  },
  {
    icon: Zap,
    title: "Real-Time Feedback",
    description: "Instant analysis with sub-100ms response time",
  },
  {
    icon: Lock,
    title: "Complete Privacy",
    description: "All data processed locally on your private server",
  },
  {
    icon: DollarSign,
    title: "Cost-Free Operation",
    description: "No subscription fees or cloud service charges",
  },
  {
    icon: TrendingUp,
    title: "Measurable Progress",
    description: "Track improvement with detailed analytics and reports",
  },
  {
    icon: Users,
    title: "Domain-Specific",
    description: "Tailored evaluation for different presentation contexts",
  },
];

const Benefits = () => {
  return (
    <section className="py-24 px-4 bg-gradient-hero">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade AI coaching that prioritizes your privacy and delivers measurable results
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 animate-fade-in group hover:shadow-glow-primary"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
