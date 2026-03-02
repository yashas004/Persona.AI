import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Play } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
          Ready to Master Your Communication?
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Choose your path to improvement. Practice with AI-powered feedback tailored to your goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/practice">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Play className="mr-2 h-5 w-5" />
              Start Practicing Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/resume-interview">
            <Button size="lg" variant="outline" className="border-primary text-foreground hover:bg-primary/10">
              <FileText className="mr-2 h-5 w-5" />
              Try Resume Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
