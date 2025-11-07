import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-background border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="url(#footer-gradient)"/>
                <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14L20 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 16L20 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 18L20 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="footer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#A855F7', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
              </svg>
              <span className="font-bold text-foreground">Persona.AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform your communication skills with AI-powered coaching and real-time feedback.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-center mr-8">
              <div>
                <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <a href="/features" className="hover:text-foreground transition-colors">Features</a>
                  <a href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
                  <a href="/technology" className="hover:text-foreground transition-colors">Technology</a>
                  <a href="/get-started" className="hover:text-foreground transition-colors">Get Started</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Persona.AI.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
