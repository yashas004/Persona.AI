import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, TrendingUp, Award, Brain, Eye, Mic2, MessageSquare, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { categories } from "@/components/CategorySelection";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    duration = 0, 
    metrics = {}, 
    transcript = "", 
    speechAnalysis = null,
    contentAnalysis = null,
    category = "students"
  } = location.state || {};

  const categoryInfo = categories.find(c => c.id === category);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const overallScore = Math.round(
    (metrics.eyeContact + metrics.posture + metrics.clarity + metrics.engagement) / 4
  );

  const getFeedback = (score: number) => {
    if (score >= 80) return { text: "Excellent!", color: "text-green-400" };
    if (score >= 60) return { text: "Good Work", color: "text-blue-400" };
    if (score >= 40) return { text: "Keep Practicing", color: "text-yellow-400" };
    return { text: "Needs Improvement", color: "text-orange-400" };
  };

  const recommendations = [
    {
      title: "Eye Contact & Gaze",
      score: metrics.eyeContact || 0,
      feedback: metrics.eyeContact >= 70 
        ? "Excellent eye contact! You maintained strong camera presence and engagement."
        : "Practice looking directly at the camera. Use the 50/50 rule: 50% looking at camera, 50% at notes.",
      icon: Eye,
      algorithm: "MediaPipe Iris Tracking (21 landmarks/iris) + EAR (Eye Aspect Ratio)"
    },
    {
      title: "Posture & Body Language",
      score: metrics.posture || 0,
      feedback: metrics.posture >= 70
        ? "Great posture! Your body language conveys confidence and professionalism."
        : "Keep shoulders back, spine straight. MediaPipe detected slouching - practice the 'wall test' for alignment.",
      icon: Activity,
      algorithm: "MediaPipe Pose (33 keypoints) + Joint Angle Analysis"
    },
    {
      title: "Speech Clarity & Voice",
      score: metrics.clarity || 0,
      feedback: speechAnalysis 
        ? `Voice clarity: ${metrics.clarity}%. ${speechAnalysis.feedback}`
        : "Speak at a moderate pace and enunciate clearly. Practice breathing exercises for better vocal control.",
      icon: Mic2,
      algorithm: "YIN Pitch Detection + SNR (Signal-to-Noise Ratio) + RMS Volume"
    },
    {
      title: "Content & Engagement",
      score: metrics.engagement || 0,
      feedback: speechAnalysis && speechAnalysis.wordsPerMinute > 0
        ? `Speaking at ${speechAnalysis.wordsPerMinute} WPM. ${speechAnalysis.fillerPercentage > 10 ? 'Reduce fillers by pausing deliberately.' : 'Good fluency!'}`
        : "Use varied vocal tones and strategic pauses to maintain interest.",
      icon: MessageSquare,
      algorithm: "TF-IDF + Cosine Similarity + Syllable Estimation"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/practice")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Practice
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-border"
              onClick={() => window.print()}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Category Badge */}
        {categoryInfo && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm text-primary font-medium">
                Analysis for: {categoryInfo.title}
              </span>
            </div>
          </div>
        )}

        {/* Overall Score Card */}
        <Card className="p-8 bg-gradient-card border-border mb-6 text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-primary mb-4 relative">
            <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{overallScore}%</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-foreground">
            Session Complete!
          </h2>
          <p className={`text-xl mb-2 ${getFeedback(overallScore).color}`}>
            {getFeedback(overallScore).text}
          </p>
          <p className="text-muted-foreground">
            Duration: {formatTime(duration)}
          </p>
        </Card>

        {/* Detailed Metrics with Algorithms */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {recommendations.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-gradient-card border-border animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                  </div>
                  <span className={`text-2xl font-bold ${getFeedback(item.score).color}`}>
                    {item.score}%
                  </span>
                </div>
                
                <Progress value={item.score} className="mb-4" />
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {item.feedback}
                </p>
                
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <Brain className="w-3 h-3 inline mr-1" />
                    Algorithm: {item.algorithm}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Speech Analysis Details */}
        {speechAnalysis && speechAnalysis.totalWords > 0 && (
          <Card className="p-6 bg-gradient-card border-border mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Advanced Speech Analysis</h3>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {speechAnalysis.wordsPerMinute}
                </div>
                <div className="text-sm text-muted-foreground">Words Per Minute</div>
                <div className="text-xs text-muted-foreground mt-1">Ideal: 120-150 WPM</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-accent mb-1">
                  {speechAnalysis.totalWords}
                </div>
                <div className="text-sm text-muted-foreground">Total Words</div>
                <div className="text-xs text-muted-foreground mt-1">Content words: {speechAnalysis.totalWords - speechAnalysis.fillerCount}</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {speechAnalysis.fillerCount}
                </div>
                <div className="text-sm text-muted-foreground">Filler Words</div>
                <div className="text-xs text-muted-foreground mt-1">{speechAnalysis.fillerPercentage}% of speech</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-accent mb-1">
                  {speechAnalysis.articulationScore}%
                </div>
                <div className="text-sm text-muted-foreground">Articulation</div>
                <div className="text-xs text-muted-foreground mt-1">Fluency: {speechAnalysis.fluencyScore}%</div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-background/30">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Speech Recognition Algorithms
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Web Speech API - Real-time transcription with confidence scores</li>
                <li>• Syllable Estimation - Vowel cluster counting for accurate pace measurement</li>
                <li>• Context-Aware Filler Detection - Multi-layer NLP pattern matching</li>
                <li>• Lexical Diversity (TTR) - Type-Token Ratio: {speechAnalysis.lexicalDiversity || 0}%</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Content Analysis with NLP */}
        {contentAnalysis && transcript.length > 20 && (
          <Card className="p-6 bg-gradient-card border-border mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Content Analysis (NLP)</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {contentAnalysis.coherenceScore}%
                </div>
                <div className="text-sm text-muted-foreground">Coherence Score</div>
                <div className="text-xs text-muted-foreground mt-1">Cosine Similarity</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-accent mb-1">
                  {contentAnalysis.vocabularyRichness}%
                </div>
                <div className="text-sm text-muted-foreground">Vocabulary Richness</div>
                <div className="text-xs text-muted-foreground mt-1">Unique / Total Words</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary mb-1">
                  {contentAnalysis.readabilityScore}%
                </div>
                <div className="text-sm text-muted-foreground">Readability</div>
                <div className="text-xs text-muted-foreground mt-1">Sentence Complexity</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-sm font-semibold text-foreground mb-2">Sentiment Analysis</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`text-xl font-bold ${
                    contentAnalysis.sentimentLabel === 'positive' ? 'text-green-400' :
                    contentAnalysis.sentimentLabel === 'negative' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {contentAnalysis.sentimentLabel}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Score: {contentAnalysis.sentimentScore}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">VADER Algorithm with Context Modifiers</div>
              </div>
              
              <div className="p-4 rounded-lg bg-background/50">
                <div className="text-sm font-semibold text-foreground mb-2">Named Entities (NER)</div>
                <div className="text-xl font-bold text-primary mb-1">
                  {contentAnalysis.entityCount}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Pattern-based entity extraction
                </div>
                {contentAnalysis.topEntities && contentAnalysis.topEntities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contentAnalysis.topEntities.map((entity: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {entity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background/30">
              <div className="text-sm font-semibold text-foreground mb-2">Top Keywords (TF-IDF)</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {contentAnalysis.topKeywords && contentAnalysis.topKeywords.map((keyword: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                <Brain className="w-3 h-3 inline mr-1" />
                Term Frequency-Inverse Document Frequency analysis with stopword filtering
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-background/30">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                NLP Algorithms Applied
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• TF-IDF - Keyword extraction by term frequency & document rarity</li>
                <li>• Cosine Similarity - Semantic consistency between sentences</li>
                <li>• VADER Sentiment - Valence-aware sentiment with negation handling</li>
                <li>• NER Pattern Matching - Capitalization & context-based entity detection</li>
                <li>• Jaccard Similarity - Topic relevance measurement</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Transcript Section */}
        {transcript && transcript.length > 20 && (
          <Card className="p-6 bg-gradient-card border-border mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📝</span>
              <h3 className="text-lg font-bold text-foreground">Your Speech Transcript</h3>
            </div>
            <div className="p-4 rounded-lg bg-background/50 max-h-48 overflow-y-auto">
              <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
            </div>
          </Card>
        )}

        {/* Key Insights */}
        <Card className="p-6 bg-gradient-card border-border mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold text-foreground">Session Insights</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.round(duration / 60)} min
              </div>
              <div className="text-sm text-muted-foreground">Practice Time</div>
              <div className="text-xs text-muted-foreground mt-1">Real-time multi-modal analysis</div>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-accent mb-1">
                {Math.round((metrics.eyeContact / 100) * duration)}s
              </div>
              <div className="text-sm text-muted-foreground">Strong Eye Contact</div>
              <div className="text-xs text-muted-foreground mt-1">MediaPipe Iris tracking</div>
            </div>
            
            <div className="p-4 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-primary mb-1">
                5+
              </div>
              <div className="text-sm text-muted-foreground">AI Algorithms</div>
              <div className="text-xs text-muted-foreground mt-1">MediaPipe, YIN, TF-IDF, VADER, NER</div>
            </div>
          </div>
        </Card>

        {/* Achievement Badge */}
        {overallScore >= 70 && (
          <Card className="p-6 bg-gradient-primary border-primary/50 text-center animate-fade-in">
            <Award className="w-12 h-12 mx-auto mb-3 text-white" />
            <h3 className="text-xl font-bold text-white mb-2">
              Achievement Unlocked!
            </h3>
            <p className="text-white/90">
              You've earned the "Rising Communicator" badge for scoring above 70%
            </p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            size="lg"
            onClick={() => navigate("/practice", { state: { category } })}
            className="bg-primary hover:bg-primary/90"
          >
            Practice Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/")}
            className="border-border"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
