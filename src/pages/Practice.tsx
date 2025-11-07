import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Mic, MicOff, Video, VideoOff, Square, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisionAnalyzer } from "@/lib/visionAnalysis";
import { AudioAnalyzer } from "@/lib/audioAnalysis";
import { SpeechRecognitionService, SpeechAnalyzer } from "@/lib/speechRecognition";
import { ContentAnalyzer } from "@/lib/contentAnalysis";
import { FusionAlgorithm } from "@/lib/fusionAlgorithm";
import type { RawMetrics } from "@/lib/fusionAlgorithm";
import CategorySelection, { type UserCategory } from "@/components/CategorySelection";

const Practice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<UserCategory | null>(
    (location.state?.category as UserCategory) || null
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const [metrics, setMetrics] = useState({
    eyeContact: 0,
    posture: 0,
    clarity: 0,
    engagement: 0,
    pitch: 0,
    volume: 0,
    gestureVariety: 0,
    emotion: 'neutral',
  });

  const [feedback, setFeedback] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const visionAnalyzerRef = useRef<VisionAnalyzer | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const speechAnalyzerRef = useRef<SpeechAnalyzer>(new SpeechAnalyzer());
  const contentAnalyzerRef = useRef<ContentAnalyzer>(new ContentAnalyzer());
  const fusionAlgorithmRef = useRef<FusionAlgorithm>(new FusionAlgorithm());
  const animationFrameRef = useRef<number | null>(null);
  const lastBackendAnalysisRef = useRef<number>(0);

  // Initialize advanced AI/ML models on mount
  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing advanced AI/ML models (MediaPipe)...");
        visionAnalyzerRef.current = new VisionAnalyzer();
        await visionAnalyzerRef.current.initialize();
        setModelsLoaded(true);
        console.log("MediaPipe models loaded successfully");

        toast({
          title: "AI Models Ready",
          description: "MediaPipe Face Mesh (468 landmarks), Pose (33 keypoints), YIN pitch detection, SNR clarity, TF-IDF, and sentiment analysis ready",
        });
      } catch (error) {
        console.error("Failed to initialize AI models:", error);
        setModelsLoaded(true);
        toast({
          title: "Model Loading Warning",
          description: "Some advanced features may be limited",
          variant: "destructive",
        });
      }
    };
    init();

    // Initialize speech recognition
    const speechService = new SpeechRecognitionService();
    if (!speechService.isSupported()) {
      setSpeechRecognitionSupported(false);
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support speech recognition. Try Chrome or Edge.",
        variant: "destructive",
      });
    } else {
      speechRecognitionRef.current = speechService;

      speechService.onTranscript((text, isFinal) => {
        if (isFinal) {
          setFinalTranscript(prev => prev + ' ' + text);
          setInterimTranscript('');
          speechAnalyzerRef.current.analyzeTranscript(text);
        } else {
          setInterimTranscript(text);
        }
      });

      speechService.onError((error) => {
        console.error('Speech recognition error:', error);
        if (error === 'not-allowed') {
          toast({
            title: "Microphone Permission Required",
            description: "Please allow microphone access for speech analysis",
            variant: "destructive",
          });
        }
      });
    }

    return () => {
      if (visionAnalyzerRef.current) visionAnalyzerRef.current.cleanup();
      if (audioAnalyzerRef.current) audioAnalyzerRef.current.cleanup();
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
    };
  }, [toast]);

  // Real-time analysis loop
  useEffect(() => {
    if (!isRecording || !videoRef.current || !canvasRef.current) return;

    const analyzeFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      const timestamp = performance.now();

      try {
        const visionMetrics = visionAnalyzerRef.current
          ? await visionAnalyzerRef.current.analyzeFrame(video, timestamp)
          : null;

        // Draw landmarks
        const overlayCanvas = overlayCanvasRef.current;
        if (overlayCanvas && visionMetrics) {
          overlayCanvas.width = video.videoWidth;
          overlayCanvas.height = video.videoHeight;
          const ctx = overlayCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

            // Face mesh
            if (visionMetrics.face.landmarks?.length > 0) {
              ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
              visionMetrics.face.landmarks.forEach((landmark: unknown) => {
                const lm = landmark as { x: number; y: number };
                const x = lm.x * overlayCanvas.width;
                const y = lm.y * overlayCanvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
              });
            }

            // Pose
            if (visionMetrics.posture.landmarks?.length > 0) {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
              ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
              ctx.lineWidth = 2;

              visionMetrics.posture.landmarks.forEach((landmark: unknown) => {
                const lm = landmark as { x: number; y: number };
                const x = lm.x * overlayCanvas.width;
                const y = lm.y * overlayCanvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
              });

              const connections = [
                [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
                [11, 23], [12, 24], [23, 24],
                [23, 25], [25, 27], [24, 26], [26, 28],
                [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8]
              ];

              connections.forEach(([start, end]) => {
                const landmarks = visionMetrics.posture.landmarks;
                if (landmarks && landmarks[start] && landmarks[end]) {
                  const lm1 = landmarks[start] as { x: number; y: number };
                  const lm2 = landmarks[end] as { x: number; y: number };
                  const startX = lm1.x * overlayCanvas.width;
                  const startY = lm1.y * overlayCanvas.height;
                  const endX = lm2.x * overlayCanvas.width;
                  const endY = lm2.y * overlayCanvas.height;
                  ctx.beginPath();
                  ctx.moveTo(startX, startY);
                  ctx.lineTo(endX, endY);
                  ctx.stroke();
                }
              });
            }
          }
        }

        const audioFeatures = audioAnalyzerRef.current?.getAudioFeatures() || null;
        const speechMetrics = speechAnalyzerRef.current.getMetrics();
        const contentMetrics = finalTranscript.length > 20
          ? contentAnalyzerRef.current.analyzeContent(finalTranscript)
          : null;

        // Ensure speech metrics have reasonable defaults when no speech detected
        const enhancedSpeechMetrics = {
          ...speechMetrics,
          clarityScore: speechMetrics.totalWords > 0 ? speechMetrics.clarityScore : 70, // Default clarity when no speech
          fluencyScore: speechMetrics.totalWords > 0 ? speechMetrics.fluencyScore : 70,
          articulationScore: speechMetrics.totalWords > 0 ? speechMetrics.articulationScore : 70,
        };

        if (visionMetrics && audioFeatures) {
          const rawMetrics: RawMetrics = {
            eyeContact: visionMetrics.face.eyeContact,
            emotion: visionMetrics.face.emotion,
            emotionConfidence: visionMetrics.face.emotionConfidence,
            postureScore: visionMetrics.posture.postureScore,
            shoulderAlignment: visionMetrics.posture.shoulderAlignment,
            headPosition: visionMetrics.posture.headPosition,
            gestureVariety: visionMetrics.gestures.gestureVariety,
            handVisibility: visionMetrics.gestures.handVisibility,

            pitch: audioFeatures.pitch,
            pitchVariation: audioFeatures.pitchVariation,
            volume: audioFeatures.volume,
            volumeVariation: audioFeatures.volumeVariation,
            clarity: audioFeatures.clarity,
            energy: audioFeatures.energy,

            wordsPerMinute: enhancedSpeechMetrics.wordsPerMinute,
            fillerCount: enhancedSpeechMetrics.fillerCount,
            fillerPercentage: enhancedSpeechMetrics.fillerPercentage,
            clarityScore: enhancedSpeechMetrics.clarityScore,
            fluencyScore: enhancedSpeechMetrics.fluencyScore,
            articulationScore: enhancedSpeechMetrics.articulationScore,
          };

          fusionAlgorithmRef.current.setContext(selectedCategory || 'students');
          const fusedMetrics = fusionAlgorithmRef.current.fuse(rawMetrics);

          const contentBoost = contentMetrics ? (contentMetrics.coherenceScore / 100) * 10 : 0;
          const newMetrics = {
            eyeContact: fusedMetrics.eyeContact,
            posture: fusedMetrics.posture,
            clarity: fusedMetrics.speechClarity,
            engagement: Math.min(100, fusedMetrics.contentEngagement + contentBoost),
            pitch: audioFeatures.pitch,
            volume: audioFeatures.volume,
            gestureVariety: fusedMetrics.bodyLanguage,
            emotion: visionMetrics.face.emotion,
          };

          setMetrics(newMetrics);

          const feedbackParts = [];
          if (fusedMetrics.eyeContact < 50) feedbackParts.push("Improve eye contact");
          if (fusedMetrics.posture < 60) feedbackParts.push("Straighten your posture");
          if (speechMetrics.wordsPerMinute > 150) feedbackParts.push("Slow down - speak at 120-150 WPM");
          if (speechMetrics.wordsPerMinute < 80 && speechMetrics.wordsPerMinute > 0) feedbackParts.push("Speak faster");
          if (audioFeatures.volume < -40) feedbackParts.push("Speak louder");
          if (fusedMetrics.bodyLanguage < 40) feedbackParts.push("Use more hand gestures");
          if (speechMetrics.fillerPercentage > 10) feedbackParts.push(`Reduce filler words (${speechMetrics.fillerPercentage}%)`);
          if (contentMetrics && contentMetrics.coherenceScore < 60) feedbackParts.push("Improve flow and coherence");
          if (contentMetrics && contentMetrics.sentimentLabel === 'negative') feedbackParts.push("Use more positive language");
          if (fusedMetrics.confidence < 50) feedbackParts.push("Low signal quality");

          setFeedback(feedbackParts.length > 0 ? feedbackParts.join(" • ") : "Excellent! Keep it up!");
        }

        // Backend analysis every 15s
        const now = Date.now();
        if (now - lastBackendAnalysisRef.current > 15000 && finalTranscript.length > 50) {
          lastBackendAnalysisRef.current = now;
          const context = canvas.getContext("2d");
          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            const imageData = canvas.toDataURL("image/jpeg", 0.8);
            const { error } = await supabase.functions.invoke('analyze-presentation', {
              body: { imageData, transcript: finalTranscript }
            });
            if (error) console.error('Backend error:', error);
          }
        }
      } catch (error) {
        console.error("Error analyzing frame:", error);
      }

      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    };

    analyzeFrame();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, finalTranscript, selectedCategory]);

  // Audio level monitoring
  useEffect(() => {
    if (!isRecording) {
      setAudioLevel(0);
      return;
    }
    const update = () => {
      if (audioAnalyzerRef.current) {
        const features = audioAnalyzerRef.current.getAudioFeatures();
        const normalized = Math.max(0, Math.min(100, (features.volume + 60) * 1.67));
        setAudioLevel(Math.round(normalized));
      }
      if (isRecording) requestAnimationFrame(update);
    };
    update();
  }, [isRecording]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsCameraOn(true);
      setIsMicOn(true);
      toast({ title: "Camera Ready", description: "Camera and microphone are now active" });
    } catch (error) {
      console.error("Camera error:", error);
      toast({ title: "Camera Access Denied", description: "Please allow access", variant: "destructive" });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  };

  const toggleMicrophone = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
      setIsMicOn(!isMicOn);
    }
  };

  const startRecording = () => {
    if (!isCameraOn || !modelsLoaded || !stream) return;

    setIsRecording(true);
    setRecordingTime(0);
    setFinalTranscript("");
    setInterimTranscript("");
    setFeedback("");
    speechAnalyzerRef.current.reset();
    contentAnalyzerRef.current.reset();
    fusionAlgorithmRef.current.reset();
    lastBackendAnalysisRef.current = 0;

    audioAnalyzerRef.current = new AudioAnalyzer();
    audioAnalyzerRef.current.initialize(stream);

    if (speechRecognitionRef.current && speechRecognitionSupported) {
      const started = speechRecognitionRef.current.start();
      if (!started) {
        toast({ title: "Speech Recognition Failed", description: "Could not start", variant: "destructive" });
      }
    }

    toast({
      title: "Recording Started",
      description: "Real-time AI analysis active",
    });
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
    if (audioAnalyzerRef.current) audioAnalyzerRef.current.cleanup();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const finalAnalysis = speechAnalyzerRef.current.getMetrics();
    toast({ title: "Recording Stopped", description: "Analyzing session..." });

    setTimeout(async () => {
      const contentMetrics = finalTranscript.length > 20
        ? contentAnalyzerRef.current.analyzeContent(finalTranscript)
        : null;

      // Save session data to Supabase if user is logged in
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const sessionData = {
            user_id: user.id,
            duration: recordingTime,
            category: selectedCategory || 'general',
            metrics: {
              eyeContact: Math.round(metrics.eyeContact),
              posture: Math.round(metrics.posture),
              clarity: Math.round(metrics.clarity),
              engagement: Math.round(metrics.engagement),
            },
            transcript: finalTranscript || '',
            speech_analysis: finalAnalysis || {},
            content_analysis: contentMetrics || {},
            feedback: feedback || 'No feedback available',
            created_at: new Date().toISOString(),
          };

          console.log('Saving session data:', sessionData); // Debug log

          const { data, error } = await supabase
            .from('practice_sessions')
            .insert(sessionData)
            .select();

          if (error) {
            console.error('Error saving session to Supabase:', error);
            // Silently handle save errors - session data is still available locally
          } else {
            console.log('Session saved successfully to Supabase:', data);
            toast({
              title: "Session Saved!",
              description: "Your practice data has been saved to your dashboard.",
            });
          }
        } else {
          console.log('No authenticated user - session not saved to Supabase');
        }
      } catch (error: unknown) {
        console.error('Error saving session data:', error);
        // Silently handle save errors - session data is still available locally
      }

      navigate("/results", {
        state: {
          duration: recordingTime,
          metrics,
          transcript: finalTranscript,
          speechAnalysis: finalAnalysis,
          contentAnalysis: contentMetrics,
          feedback,
          category: selectedCategory,
        }
      });
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!selectedCategory) {
    return <CategorySelection onSelect={setSelectedCategory} />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Area */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-card border-border">
              <div className="relative aspect-video bg-background rounded-lg overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: 'cover' }} />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/90">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Camera is off</p>
                    </div>
                  </div>
                )}

                {isRecording && (
                  <>
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/90 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-white">Live AI Analysis</span>
                      </div>
                      {(finalTranscript || interimTranscript) && (
                        <div className="px-3 py-2 bg-background/90 rounded-lg max-w-md max-h-32 overflow-y-auto">
                          <p className="text-xs text-foreground">
                            {finalTranscript} <span className="text-muted-foreground italic">{interimTranscript}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 px-4 py-2 bg-background/90 rounded-full">
                      <span className="text-lg font-bold text-primary">{formatTime(recordingTime)}</span>
                    </div>
                    {feedback && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="px-4 py-3 bg-primary/90 rounded-lg">
                          <p className="text-sm font-medium text-white">{feedback}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* CONTROLS WITH LANGUAGE SELECTOR */}
              <div className="flex flex-wrap justify-center gap-4 items-center">
                {!isCameraOn ? (
                  <Button size="lg" onClick={startCamera} className="bg-primary hover:bg-primary/90">
                    <Camera className="w-5 h-5 mr-2" /> Turn On Camera
                  </Button>
                ) : (
                  <>
                    <Button size="lg" variant="outline" onClick={stopCamera} className="border-border">
                      <VideoOff className="w-5 h-5 mr-2" /> Stop Camera
                    </Button>

                    <Button size="lg" variant="outline" onClick={toggleMicrophone} className="border-border">
                      {isMicOn ? (
                        <> <Mic className="w-5 h-5 mr-2" /> Mic On </>
                      ) : (
                        <> <MicOff className="w-5 h-5 mr-2" /> Mic Off </>
                      )}
                    </Button>

                    {/* LANGUAGE SELECTOR */}
                    <select
                      className="px-4 py-2 text-sm rounded border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={(e) => speechRecognitionRef.current?.setLanguage(e.target.value as "en" | "hi" | "te")}
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                    </select>

                    {!isRecording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="bg-primary hover:bg-primary/90"
                        disabled={!modelsLoaded}
                      >
                        <Video className="w-5 h-5 mr-2" />
                        {modelsLoaded ? "Start Recording" : "Loading AI..."}
                      </Button>
                    ) : (
                      <Button size="lg" onClick={stopRecording} variant="destructive">
                        <Square className="w-5 h-5 mr-2" /> Stop Recording
                      </Button>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Real-Time Analytics */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-card border-border">
              <h3 className="text-lg font-bold mb-4 text-foreground">Real-Time AI Analysis</h3>

              {!isRecording ? (
                <div className="text-center py-8">
                  {!modelsLoaded ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Loading AI Models</p>
                        <p className="text-xs text-muted-foreground">Initializing MediaPipe Face Mesh, Pose Detection, and Audio Analysis</p>
                        <div className="flex justify-center space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Start recording to see live AI analysis
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Eye Contact</span>
                      <span className="text-sm font-bold text-primary">{metrics.eyeContact}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${metrics.eyeContact}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Posture</span>
                      <span className="text-sm font-bold text-primary">{metrics.posture}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-secondary transition-all duration-500" style={{ width: `${metrics.posture}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Clarity</span>
                      <span className="text-sm font-bold text-primary">{metrics.clarity}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-accent transition-all duration-500" style={{ width: `${metrics.clarity}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Engagement</span>
                      <span className="text-sm font-bold text-primary">{metrics.engagement}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${metrics.engagement}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Audio Level</span>
                      <span className="text-sm font-bold text-primary">{audioLevel}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all duration-100" style={{ width: `${audioLevel}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Emotion</p>
                      <p className="text-sm font-bold text-foreground capitalize">{metrics.emotion}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Gestures</p>
                      <p className="text-sm font-bold text-foreground">{metrics.gestureVariety}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Pitch</p>
                      <p className="text-sm font-bold text-foreground">{metrics.pitch} Hz</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Volume</p>
                      <p className="text-sm font-bold text-foreground">{metrics.volume} dB</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
