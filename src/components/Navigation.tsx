import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { User, LogOut, Menu } from "lucide-react";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="url(#nav-gradient)"/>
                <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14L20 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 16L20 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 18L20 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="nav-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#8B5CF6', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#A855F7', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-xl font-bold text-foreground">Persona.AI</span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="/technology" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Technology
              </a>

              {user ? (
                <div className="flex items-center gap-4">
                  <a href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <User className="w-4 h-4" />
                    Dashboard
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSignOut}
                    className="border-border hover:bg-secondary"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col gap-6 mt-6">
                    <a
                      href="/features"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      Features
                    </a>
                    <a
                      href="/how-it-works"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      How It Works
                    </a>
                    <a
                      href="/technology"
                      className="text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      Technology
                    </a>

                    <div className="border-t border-border pt-6">
                      {user ? (
                        <div className="flex flex-col gap-4">
                          <a
                            href="/dashboard"
                            className="flex items-center gap-2 text-lg text-muted-foreground hover:text-foreground transition-colors py-2"
                          >
                            <User className="w-5 h-5" />
                            Dashboard
                          </a>
                          <Button
                            variant="outline"
                            onClick={handleSignOut}
                            className="justify-start border-border hover:bg-secondary"
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setShowAuthModal(true)}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          // Optionally navigate to dashboard after successful auth
          // navigate('/dashboard');
        }}
      />
    </>
  );
};

export default Navigation;
