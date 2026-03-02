import React, { useRef, useState } from 'react';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speechRef = useRef<SpeechRecognitionService | null>(null);
  const visionRef = useRef<VisionAnalyzer | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const extracted = await extractTextFromPdf(f);
      setText(extracted || '');
    }
  }

  function handleGenerate() {
    const analysis = analyzeResumeText(text || '');
    setSkills(analysis.skills);
    const q = generateInterviewQuestions(analysis.skills);
    setQuestions(q);
    setCurrent(0);
    setRecords([]);
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
    <div style={{ padding: 16 }}>
      <h2>Resume-Based Interview</h2>

      <div>
        <label>Upload Resume (PDF): </label>
        <input type="file" accept="application/pdf" onChange={handleFile} />
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={handleGenerate} disabled={!text}>Generate Questions</button>
        <button onClick={startMedia} style={{ marginLeft: 8 }}>Start Camera & Mic</button>
        <button onClick={stopMedia} style={{ marginLeft: 8 }}>Stop Camera</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Detected Text:</strong>
        <pre style={{ maxHeight: 120, overflow: 'auto', background: '#f6f6f6', padding: 8 }}>{text || '—'}</pre>
      </div>

      <div>
        <strong>Skills:</strong> {skills.join(', ') || '—'}
      </div>

      {questions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3>Question {current + 1} of {questions.length}</h3>
          <p>{questions[current].question}</p>

          <div>
            <button onClick={startRecording} disabled={isRecording}>Start Recording (Speech Rec)</button>
            <button onClick={stopRecording} disabled={!isRecording} style={{ marginLeft: 8 }}>Stop</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h4>Results</h4>
        {records.map((r, i) => (
          <div key={i} style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
            <div><strong>Q:</strong> {r.question}</div>
            <div><strong>Transcript:</strong> {r.transcript}</div>
            <div><strong>Score:</strong> {r.result?.overallScore ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>content {r.result?.contentScore} • clarity {r.result?.clarityScore} • confidence {r.result?.confidenceScore}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <video ref={videoRef} width={320} height={240} style={{ background: '#000' }} muted playsInline />
      </div>
    </div>
  );
}

export default ResumeInterview;
