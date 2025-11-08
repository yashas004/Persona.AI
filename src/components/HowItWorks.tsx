import { Video, BarChart3, TrendingUp, Award } from "lucide-react";

const steps = [
  {
    icon: Video,
    title: "Select Practice Category",
    description: "Choose from various presentation categories like job interviews, sales pitches, or academic presentations to focus your practice.",
  },
  {
    icon: BarChart3,
    title: "Grant Camera & Microphone Access",
    description: "Allow browser access to your camera and microphone for real-time video and audio analysis using WebRTC and Web Audio APIs.",
  },
  {
    icon: TrendingUp,
    title: "Start Real-Time Analysis",
    description: "Begin speaking while MediaPipe analyzes your facial expressions, posture, and gestures, alongside speech recognition and audio processing.",
  },
  {
    icon: Award,
    title: "View Detailed Results",
    description: "Receive comprehensive feedback on eye contact, posture, speech clarity, and content quality with personalized improvement suggestions.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your presentation skills with AI-powered coaching
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow-primary">
                  <step.icon className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
