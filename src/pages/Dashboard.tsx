import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import {
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Play,
  BarChart3,
  User,
  LogOut,
  Loader2
} from "lucide-react";

type PracticeSession = Tables<'practice_sessions'>;

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTime: 0,
    averageScore: 0,
    bestScore: 0,
  });

  const fetchUserData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user's practice sessions from Supabase
      const { data: sessionsData, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error Loading Dashboard",
          description: "Failed to load your practice sessions. Please try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched sessions:', sessionsData); // Debug log
      setSessions(sessionsData || []);

      // Calculate comprehensive statistics
      if (sessionsData && sessionsData.length > 0) {
        const totalSessions = sessionsData.length;
        const totalTime = sessionsData.reduce((sum: number, session: PracticeSession) => sum + (session.duration || 0), 0);

        // Calculate average score from all sessions
        const scores = sessionsData.map((session: PracticeSession) => {
          const metrics = session.metrics as { eyeContact: number; posture: number; clarity: number; engagement: number };
          const eyeContact = metrics.eyeContact || 0;
          const posture = metrics.posture || 0;
          const clarity = metrics.clarity || 0;
          const engagement = metrics.engagement || 0;
          return (eyeContact + posture + clarity + engagement) / 4;
        }).filter((score: number) => score > 0 && !isNaN(score));

        const averageScore = scores.length > 0
          ? scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
          : 0;

        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

        setStats({
          totalSessions,
          totalTime,
          averageScore: Math.round(averageScore),
          bestScore: Math.round(bestScore),
        });

        console.log('Calculated stats:', { totalSessions, totalTime, averageScore: Math.round(averageScore), bestScore: Math.round(bestScore) });
      } else {
        // No sessions yet
        setStats({
          totalSessions: 0,
          totalTime: 0,
          averageScore: 0,
          bestScore: 0,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Dashboard Error",
        description: "Unable to load your progress data. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchUserData();
  }, [user, navigate, fetchUserData]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="pt-24 pb-8 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-muted-foreground">
                Track your progress and continue improving your communication skills.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/practice')} className="bg-primary hover:bg-primary/90">
                <Play className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-foreground">Your Progress</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{formatDuration(stats.totalTime)}</div>
                  <div className="text-sm text-muted-foreground">Total Practice Time</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.averageScore}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{stats.bestScore}%</div>
                  <div className="text-sm text-muted-foreground">Best Score</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Sessions */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-foreground">Recent Practice Sessions</h3>

            {sessions.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-semibold mb-2 text-foreground">No practice sessions yet</h4>
                <p className="text-muted-foreground mb-4">
                  Start your first practice session to see your progress here.
                </p>
                <Button onClick={() => navigate('/practice')}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Practicing
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sessions.slice(0, 5).map((session) => (
                  <Card key={session.id} className="p-6 bg-gradient-card border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{session.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(session.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(session.duration)}
                            </span>
                            <span>Score: {Math.round((session.metrics.eyeContact + session.metrics.posture + session.metrics.clarity + session.metrics.engagement) / 4)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Eye Contact</div>
                          <div className="font-semibold">{session.metrics.eyeContact}%</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Posture</div>
                          <div className="font-semibold">{session.metrics.posture}%</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-muted-foreground">Clarity</div>
                          <div className="font-semibold">{session.metrics.clarity}%</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
