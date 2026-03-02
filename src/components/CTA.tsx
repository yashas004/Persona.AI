import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to Master Your Communication?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-8">
          Start practicing with AI-powered feedback today. Upload your resume and get personalized interview questions tailored to your skills.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/resume-interview">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <FileText className="mr-2 h-5 w-5" />
              Try Resume Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/get-started">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Learn More
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
