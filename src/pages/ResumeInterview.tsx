import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Upload, Sparkles, Mic, FileText, ArrowRight } from 'lucide-react';
import extractTextFromPdf from '../lib/resumeParser';
import analyzeResumeText from '../lib/resumeAnalyzer';
import generateInterviewQuestions from '../lib/interviewGenerator';
import evaluateAnswer from '../lib/interviewEvaluation';
import { SpeechRecognitionService } from '../lib/speechRecognition';
import type { VisionAnalyzer } from '../lib/visionAnalysis';

type QARecord = {
  questionIndex: number;
  question: string;
  transcript: string;
  result?: any;
};

export function ResumeInterview(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [records, setRecords] = useState<QARecord[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [submittedTranscript, setSubmittedTranscript] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speechRef = useRef<SpeechRecognitionService | null>(null);
  const visionRef = useRef<VisionAnalyzer | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError('');
    if (f) {
      setLoading(true);
      try {
        const extracted = await extractTextFromPdf(f);
        if (!extracted) {
          setError('Could not extract text from PDF. Try a text-based PDF (not scanned image).');
          setText('');
        } else {
          setText(extracted);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read PDF';
        setError(`PDF Error: ${msg}`);
        setText('');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleGenerate() {
    setError('');
    if (!text || text.trim().length < 10) {
      setError('Please upload a resume or paste at least 10 characters of text.');
      return;
    }
    try {
      const analysis = analyzeResumeText(text || '');
      if (!analysis.skills || analysis.skills.length === 0) {
        setError('No skills detected. Try adding skills like "React", "Python", "AWS" to your resume.');
      }
      setSkills(analysis.skills);
      const q = generateInterviewQuestions(analysis.skills);
      setQuestions(q);
      setCurrent(0);
      setRecords([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(`Generation Error: ${msg}`);
    }
  }

  async function startMedia() {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      // Lazy-load VisionAnalyzer to avoid heavy imports at module load
      try {
        const mod = await import('../lib/visionAnalysis');
        const VisionAnalyzer = mod.VisionAnalyzer;
        const v = new VisionAnalyzer();
        await v.initialize(videoRef.current);
        visionRef.current = v;
      } catch (err) {
        console.warn('Could not initialize VisionAnalyzer:', err);
      }
    } catch (err) {
      console.warn('Could not start media:', err);
    }
  }

  function stopMedia() {
    if (!videoRef.current) return;
    const s = videoRef.current.srcObject as MediaStream | null;
    if (s) {
      s.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }

  function startRecording() {
    if (!speechRef.current) speechRef.current = new SpeechRecognitionService();
    const s = speechRef.current;
    if (!s.isSupported()) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    setIsRecording(true);
    setLiveTranscript('');
    setSubmittedTranscript('');
    s.onTranscript((transcript, isFinal) => {
      setLiveTranscript(transcript);
      if (isFinal) {
        // stop recording but don't evaluate yet
        s.stop();
        setIsRecording(false);
        setSubmittedTranscript(transcript);
      }
    });
    s.start();
  }

  function stopRecording() {
    const s = speechRef.current;
    if (s) s.stop();
    setIsRecording(false);
  }

  async function submitAnswer() {
    if (!submittedTranscript) {
      setError('No transcript recorded. Please try recording again.');
      return;
    }
    const q = questions[current];
    const expected = q.expectedTopics || [];
    const result = await evaluateAnswer(q.question, expected, submittedTranscript, videoRef.current || undefined);
    setRecords(prev => [...prev, { questionIndex: current, question: q.question, transcript: submittedTranscript, result }]);
    setLiveTranscript('');
    setSubmittedTranscript('');
    setCurrent(c => c + 1);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="pb-12 px-4 bg-gradient-hero">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Resume-Based Interview
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and practice answering interview questions tailored to your skills. Get AI-powered feedback in real-time.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Error Banner */}
            {error && (
              <Card className="mb-8 bg-destructive/10 border-destructive/20 p-4">
                <p className="text-destructive font-medium">{error}</p>
              </Card>
            )}

            {/* Step 1: Upload Resume */}
            <Card className="mb-8 p-6 md:p-8 border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg">1</div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume</h2>
                  <p className="text-muted-foreground">Upload a PDF or paste your resume text</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFile}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-foreground font-medium">Click to upload PDF</p>
                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                  </label>
                </div>
                {file && <p className="text-sm text-green-600 font-medium flex items-center gap-2">✓ File ready: {file.name}</p>}
              </div>
            </Card>

            {/* Step 2: Review & Generate */}
            <Card className="mb-8 p-6 md:p-8 border-border/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg">2</div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Review & Generate</h2>
                  <p className="text-muted-foreground">Edit the extracted text and generate questions</p>
                </div>
              </div>
              
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(''); }}
                placeholder="Resume text will appear here after upload, or paste manually..."
                className="w-full h-40 p-4 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!text || loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? 'Generating...' : 'Generate Questions'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Skills */}
            {skills.length > 0 && (
              <Card className="mb-8 p-6 md:p-8 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Detected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Interview Session */}
            {questions.length > 0 && (
              <Card className="mb-8 p-6 md:p-8 border-border/50">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-lg">3</div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Interview Session</h2>
                    <p className="text-muted-foreground">Question {current + 1} of {questions.length}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-8">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{Math.round(((current + 1) / questions.length) * 100)}% complete</p>
                </div>

                {/* Current Question */}
                <div className="bg-secondary/50 p-6 rounded-lg mb-6 border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                    {questions[current]?.category}
                  </p>
                  <p className="text-xl font-semibold text-foreground leading-relaxed">{questions[current]?.question}</p>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Button onClick={startMedia} variant="outline" size="lg" className="w-full">
                    📹 Start Camera
                  </Button>
                  <Button onClick={stopMedia} variant="outline" size="lg" className="w-full">
                    ⏹ Stop Camera
                  </Button>
                </div>

                {/* Recording */}
                <div className="bg-secondary/50 p-4 rounded-lg border border-border mb-6">
                  {!isRecording && !submittedTranscript ? (
                    <Button onClick={startRecording} disabled={!questions[current]} size="lg" className="w-full">
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording Answer
                    </Button>
                  ) : isRecording ? (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <span className="animate-pulse w-3 h-3 bg-destructive rounded-full" />
                      <span className="text-foreground font-medium">Recording...</span>
                      <Button onClick={stopRecording} variant="outline" size="sm">Stop</Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button onClick={startRecording} variant="outline" size="lg" className="w-full">
                        <Mic className="mr-2 h-4 w-4" />
                        Re-record
                      </Button>
                      <Button onClick={submitAnswer} size="lg" className="w-full bg-green-600 hover:bg-green-700">
                        Submit Answer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Video with Live Transcript Overlay */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-6">
                  <video
                    ref={videoRef}
                    width={400}
                    height={300}
                    className="w-full aspect-video object-cover"
                    muted
                    playsInline
                  />
                  {/* Live Transcript Corner */}
                  {(liveTranscript || submittedTranscript) && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-primary/50 max-h-32 overflow-y-auto">
                      <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
                        {isRecording ? '🎙 Live Transcript' : '✓ Your Answer'}
                      </p>
                      <p className="text-sm text-white leading-relaxed">
                        {liveTranscript || submittedTranscript}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Results */}
            {records.length > 0 && (
              <Card className="p-6 md:p-8 border-border/50">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-xl font-bold text-primary">✓</div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Your Results</h2>
                    <p className="text-muted-foreground">{records.length} answer(s) evaluated</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {records.map((r, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 bg-secondary/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Question {i + 1}</p>
                          <p className="text-foreground font-medium mt-1">{r.question}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">{r.result?.overallScore ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-4">"{r.transcript || '(empty)'}"</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-background p-3 rounded border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{r.result?.contentScore ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-1">Content</p>
                        </div>
                        <div className="bg-background p-3 rounded border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{r.result?.clarityScore ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-1">Clarity</p>
                        </div>
                        <div className="bg-background p-3 rounded border border-border text-center">
                          <p className="text-lg font-bold text-foreground">{r.result?.confidenceScore ?? '—'}</p>
                          <p className="text-xs text-muted-foreground mt-1">Confidence</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ResumeInterview;
