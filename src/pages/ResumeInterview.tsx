import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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
    s.onTranscript(async (transcript, isFinal) => {
      if (isFinal) {
        // stop and evaluate
        s.stop();
        setIsRecording(false);
        const q = questions[current];
        const expected = q.expectedTopics || [];
        const result = await evaluateAnswer(q.question, expected, transcript, videoRef.current || undefined);
        setRecords(prev => [...prev, { questionIndex: current, question: q.question, transcript, result }]);
        setCurrent(c => Math.min(questions.length - 1, c + 1));
      }
    });
    s.start();
  }

  function stopRecording() {
    const s = speechRef.current;
    if (s) s.stop();
    setIsRecording(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="flex-1 pt-16 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Resume-Based Interview</h1>
            <p className="text-lg text-slate-600">Upload your resume and practice answering interview questions tailored to your skills.</p>
          </div>

          {/* Error Banner */}
          {error && (
            <Card className="mb-6 bg-red-50 border-red-200 p-4">
              <p className="text-red-800 font-medium">{error}</p>
            </Card>
          )}

          {/* Step 1: Upload Resume */}
          <Card className="mb-6 p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold mr-3">1</span>
              Upload Your Resume
            </h2>
            <div className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFile}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer block">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-slate-700 font-medium">Click to upload PDF resume</p>
                  <p className="text-sm text-slate-500">or drag and drop</p>
                </label>
              </div>
              {file && <p className="text-sm text-green-600 font-medium">✓ File selected: {file.name}</p>}
            </div>
          </Card>

          {/* Step 2: Review & Generate */}
          <Card className="mb-6 p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold mr-3">2</span>
              Review Extracted Text
            </h2>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Resume text will appear here after upload, or paste your resume manually..."
              className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!text || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Processing...' : 'Generate Questions'}
              </Button>
            </div>
          </Card>

          {/* Step 3: Skills Detected */}
          {skills.length > 0 && (
            <Card className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
              <h2 className="text-lg font-semibold text-green-900 mb-3">Detected Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Step 4: Interview Questions */}
          {questions.length > 0 && (
            <Card className="mb-6 p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold mr-3">3</span>
                Interview Session
              </h2>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-700">Question {current + 1} of {questions.length}</p>
                  <p className="text-sm text-slate-500">{Math.round(((current + 1) / questions.length) * 100)}%</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Question */}
              <div className="bg-slate-50 p-6 rounded-lg mb-6 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-600 font-semibold mb-2">
                  {questions[current]?.category}
                </p>
                <p className="text-xl font-semibold text-slate-900">{questions[current]?.question}</p>
              </div>

              {/* Recording Controls */}
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={startMedia}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  📹 Start Camera & Mic
                </Button>
                <Button
                  onClick={stopMedia}
                  variant="outline"
                  className="flex-1"
                >
                  ⏹ Stop Camera
                </Button>
              </div>

              {/* Speech Recording */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={!questions[current]}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    🎙 Start Recording Answer
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="animate-pulse w-3 h-3 bg-red-600 rounded-full" />
                    <p className="flex-1 text-slate-700 font-medium">Recording in progress...</p>
                    <Button onClick={stopRecording} variant="outline">Stop</Button>
                  </div>
                )}
              </div>

              {/* Video Preview */}
              <div className="mb-6 bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  width={320}
                  height={240}
                  className="w-full max-h-72 object-cover"
                  muted
                  playsInline
                />
              </div>
            </Card>
          )}

          {/* Results */}
          {records.length > 0 && (
            <Card className="p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold mr-3">✓</span>
                Your Answers & Scores
              </h2>
              <div className="space-y-4">
                {records.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-600 uppercase">Question {i + 1}</p>
                        <p className="text-slate-900 font-medium mt-1">{r.question}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{r.result?.overallScore ?? '—'}</p>
                        <p className="text-xs text-slate-500">Overall Score</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mb-3 italic">"{r.transcript || '(empty)'}"</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-lg font-semibold text-slate-900">{r.result?.contentScore ?? '—'}</p>
                        <p className="text-xs text-slate-600">Content</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-lg font-semibold text-slate-900">{r.result?.clarityScore ?? '—'}</p>
                        <p className="text-xs text-slate-600">Clarity</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-lg font-semibold text-slate-900">{r.result?.confidenceScore ?? '—'}</p>
                        <p className="text-xs text-slate-600">Confidence</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ResumeInterview;
