import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Megaphone, ShoppingCart, Video, GraduationCap, ChevronRight, Home, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type UserCategory =
  | "job-seekers"
  | "business-professionals"
  | "public-speakers"
  | "sales-service"
  | "remote-workers"
  | "students";

export interface Category {
  id: UserCategory;
  title: string;
  description: string;
  icon: LucideIcon;
  focusAreas: string[];
}

const categories: Category[] = [
  {
    id: "job-seekers",
    title: "Job Seekers",
    description: "Interview preparation with real-time feedback",
    icon: Briefcase,
    focusAreas: ["Eye Contact", "Confidence", "Clear Answers", "Body Language"]
  },
  {
    id: "business-professionals",
    title: "Business Professionals",
    description: "Enhancing presentation and negotiation skills",
    icon: Users,
    focusAreas: ["Executive Presence", "Clarity", "Persuasion", "Engagement"]
  },
  {
    id: "public-speakers",
    title: "Public Speakers & Educators",
    description: "Improving audience engagement and delivery",
    icon: Megaphone,
    focusAreas: ["Stage Presence", "Voice Modulation", "Storytelling", "Energy"]
  },
  {
    id: "sales-service",
    title: "Sales & Customer Service",
    description: "Refining persuasion and rapport-building techniques",
    icon: ShoppingCart,
    focusAreas: ["Empathy", "Active Listening", "Tone", "Closing Skills"]
  },
  {
    id: "remote-workers",
    title: "Remote Workers & Virtual Teams",
    description: "Strengthening video communication skills",
    icon: Video,
    focusAreas: ["Camera Presence", "Virtual Etiquette", "Clarity", "Engagement"]
  },
  {
    id: "students",
    title: "Students & Young Professionals",
    description: "Developing strong interpersonal skills",
    icon: GraduationCap,
    focusAreas: ["Confidence Building", "Articulation", "Networking", "Interviews"]
  }
];

interface CategorySelectionProps {
  onSelect: (category: UserCategory) => void;
}

const CategorySelection = ({ onSelect }: CategorySelectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm"
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 pt-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Path
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your category to get personalized AI analysis optimized for your specific communication needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => onSelect(category.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {category.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 flex-grow">
                    {category.description}
                  </p>
                  
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {category.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;
export { categories };
