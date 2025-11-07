// src/lib/visionAnalysis.ts   (or wherever you keep the file you just pasted)
import { pipeline, env } from '@huggingface/transformers';
import { AudioAnalyzer, type AudioFeatures } from '@/lib/audioAnalysis';   // <-- the fixed analyzer

// ---------------------------------------------------------------------
//  Hugging-Face / Transformers.js setup (unchanged)
// ---------------------------------------------------------------------
env.allowLocalModels = false;
env.useBrowserCache = true;

let emotionDetector: any = null;
let faceDetector: any = null;

// ---------------------------------------------------------------------
//  Audio analyzer instance (created once per session)
// ---------------------------------------------------------------------
let audioAnalyzer: AudioAnalyzer | null = null;

// ---------------------------------------------------------------------
//  INITIALISE MODELS (unchanged)
// ---------------------------------------------------------------------
export const initializeModels = async () => {
  try {
    console.log('Initializing AI models...');

    if (!faceDetector) {
      console.log('Loading face detection model...');
      faceDetector = await pipeline(
        'depth-estimation',
        'Xenova/dpt-large',
        { device: 'webgpu' }
      );
      console.log('Face detector loaded');
    }

    if (!emotionDetector) {
      console.log('Loading emotion detection model...');
      emotionDetector = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        { device: 'webgpu' }
      );
      console.log('Emotion detector loaded');
    }

    console.log('AI models initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing AI models:', error);
    try {
      console.log('Retrying with CPU...');
      emotionDetector = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32'
      );
      console.log('Models loaded on CPU');
      return true;
    } catch (cpuError) {
      console.error('CPU fallback also failed:', cpuError);
      return false;
    }
  }
};

// ---------------------------------------------------------------------
//  INITIALISE AUDIO ANALYZER (call once when you have a MediaStream)
// ---------------------------------------------------------------------
export const initializeAudioAnalyzer = (stream: MediaStream) => {
  if (audioAnalyzer) audioAnalyzer.cleanup();
  audioAnalyzer = new AudioAnalyzer();
  audioAnalyzer.initialize(stream);
  console.log('AudioAnalyzer initialized');
};

// ---------------------------------------------------------------------
//  GET CURRENT AUDIO FEATURES (used for clarity)
// ---------------------------------------------------------------------
const getAudioFeatures = (): AudioFeatures => {
  if (!audioAnalyzer) return {
    pitch: 0,
    pitchVariation: 0,
    volume: 0,
    volumeVariation: 0,
    pace: 0,
    clarity: 0,
    energy: 0,
    spectralCentroid: 0,
    zeroCrossingRate: 0,
    snr: 0,
  };
  return audioAnalyzer.getAudioFeatures();
};

// ---------------------------------------------------------------------
//  FACE REGION (unchanged)
// ---------------------------------------------------------------------
const detectFaceRegion = async (imageData: string) => {
  try {
    if (!faceDetector) return null;
    const depth = await faceDetector(imageData);
    if (depth && depth.depth) {
      return {
        hasFace: true,
        faceCenterX: 0.5,
        faceCenterY: 0.4,
        confidence: 0.75,
      };
    }
    return null;
  } catch (error) {
    console.error('Face detection error:', error);
    return null;
  }
};

// ---------------------------------------------------------------------
//  FACIAL EXPRESSION (unchanged)
// ---------------------------------------------------------------------
export const analyzeFacialExpression = async (videoElement: HTMLVideoElement) => {
  try {
    if (!emotionDetector) await initializeModels();

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    const emotionLabels = [
      'a happy smiling person',
      'a confident professional person',
      'a neutral calm person',
      'a focused attentive person',
      'a sad unhappy person',
      'an angry frustrated person',
      'a nervous anxious person',
      'a surprised person',
    ];

    let emotions: any[] = [];
    let hasFace = false;

    try {
      if (emotionDetector) {
        const results = await emotionDetector(imageData, emotionLabels);
        emotions = results.map((r: any) => ({
          label: r.label.replace('a ', '').replace(' person', '').split(' ')[0],
          score: r.score,
        }));
        emotions.sort((a, b) => b.score - a.score);
        hasFace = emotions[0].score > 0.15;
      }
    } catch (err) {
      console.error('Emotion detection error:', err);
    }

    const faceData = await detectFaceRegion(imageData);
    const eyeContact = faceData
      ? calculateEyeContact(faceData, canvas, videoElement)
      : 25;

    const faceScore = hasFace ? calculateExpressionScore(emotions) : 25;

    return {
      hasFace,
      eyeContact: Math.round(eyeContact),
      faceScore: Math.round(faceScore),
      emotions: emotions.slice(0, 3),
      imageData,
      faceData,
    };
  } catch (error) {
    console.error('Error analyzing facial expression:', error);
    return null;
  }
};

// ---------------------------------------------------------------------
//  EYE CONTACT & EXPRESSION SCORE (unchanged)
// ---------------------------------------------------------------------
const calculateEyeContact = (
  faceData: any,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): number => {
  if (!faceData) return 25;
  let score = 50;
  const hOffset = Math.abs(faceData.faceCenterX - 0.5);
  if (hOffset < 0.1) score += 25;
  else if (hOffset < 0.2) score += 15;
  else score -= 10;

  const v = faceData.faceCenterY;
  if (v > 0.25 && v < 0.5) score += 25;
  else if (v > 0.5) score -= 15;
  else if (v < 0.25) score += 10;

  score += faceData.confidence * 10;
  return Math.max(25, Math.min(100, score));
};

const calculateExpressionScore = (emotions: any[]): number => {
  if (!emotions.length) return 25;
  const map: Record<string, number> = {
    happy: 1.0, confident: 1.0, neutral: 0.85, calm: 0.85,
    focused: 0.95, attentive: 0.95, surprised: 0.4,
    sad: -0.7, unhappy: -0.7, angry: -1.0, frustrated: -0.8,
    nervous: -0.6, anxious: -0.6,
  };
  let score = 50;
  for (const e of emotions) {
    const key = Object.keys(map).find(k => e.label.toLowerCase().includes(k));
    if (key !== undefined) score += e.score * map[key] * 50;
  }
  return Math.max(25, Math.min(100, score));
};

// ---------------------------------------------------------------------
//  POSTURE (unchanged)
// ---------------------------------------------------------------------
export const analyzePosture = async (videoElement: HTMLVideoElement) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { posture: 50, isWellFramed: false, bodyLanguage: 'neutral' };

    ctx.drawImage(videoElement, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    let postureScore = 50;
    let bodyLanguage = 'neutral';
    let isWellFramed = false;

    try {
      if (faceDetector) {
        const depth = await faceDetector(imageData);
        if (depth && depth.depth) {
          const faceData = await detectFaceRegion(imageData);
          if (faceData?.hasFace) {
            if (faceData.faceCenterY < 0.5) {
              postureScore += 30;
              bodyLanguage = 'upright';
              isWellFramed = true;
            } else if (faceData.faceCenterY > 0.6) {
              postureScore -= 20;
              bodyLanguage = 'slouching';
            }
            if (Math.abs(faceData.faceCenterX - 0.5) < 0.15) {
              postureScore += 20;
              isWellFramed = true;
            }
          }
        }
      }
    } catch (e) { console.error(e); }

    // fallback brightness check …
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let top = 0, bot = 0;
    const mid = canvas.height / 2;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const b = (img[i] + img[i + 1] + img[i + 2]) / 3;
        if (y < mid) {
          top += b;
        } else {
          bot += b;
        }
      }
    }
    const ratio = top / (top + bot);
    postureScore += (ratio - 0.5) * 50;

    if (postureScore > 80) bodyLanguage = 'confident';
    else if (postureScore > 65) bodyLanguage = 'engaged';
    else if (postureScore > 50) bodyLanguage = 'neutral';
    else if (postureScore < 40) bodyLanguage = 'slouching';

    return {
      posture: Math.round(Math.max(25, Math.min(100, postureScore))),
      isWellFramed,
      bodyLanguage,
    };
  } catch (error) {
    console.error('Error analyzing posture:', error);
    return { posture: 50, isWellFramed: false, bodyLanguage: 'neutral' };
  }
};

// ---------------------------------------------------------------------
//  VOICE CLARITY – **NOW USES REAL AUDIO ANALYZER**
// ---------------------------------------------------------------------
const calculateVoiceClarity = (transcript: string): number => {
  const audio = getAudioFeatures();

  // 1. SNR-based clarity (the heavy-lifting part)
  let clarity = audio.clarity;               // 0-100 from YIN + SNR + ZCR + centroid

  // 2. Small filler-word penalty (keeps the old behaviour)
  if (transcript.length > 50) {
    const words = transcript.toLowerCase().split(/\s+/);
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
    const fillerRatio = fillers.reduce((c, w) => c + words.filter(v => v === w).length, 0) / words.length;
    if (fillerRatio > 0.15) clarity = Math.max(25, clarity - 20);
    else if (fillerRatio > 0.10) clarity = Math.max(25, clarity - 10);
    else if (fillerRatio < 0.05) clarity = Math.min(100, clarity + 10);
  }

  // 3. Bonus for sustained speech
  if (transcript.length > 100) clarity = Math.min(100, clarity + 5);
  if (transcript.length > 200) clarity = Math.min(100, clarity + 5);

  return Math.round(Math.max(25, Math.min(100, clarity)));
};

// ---------------------------------------------------------------------
//  ENGAGEMENT (unchanged – just uses the new clarity indirectly)
// ---------------------------------------------------------------------
const calculateEngagement = (
  hasFace: boolean,
  transcriptLength: number,
  audioLevel: number,
  emotions: any[],
  eyeContactScore: number
): number => {
  let score = 25;
  if (hasFace) score += 25;
  score += (eyeContactScore / 100) * 20;
  if (transcriptLength > 0) score += Math.min(25, (transcriptLength / 500) * 25);
  if (audioLevel > 0.2) score += Math.min(15, audioLevel * 20);
  if (emotions.length) {
    const positive = emotions.filter(e =>
      ['happy', 'confident', 'focused', 'attentive', 'calm'].some(p => e.label.toLowerCase().includes(p))
    );
    positive.forEach(e => (score += e.score * 15));
  }
  return Math.max(25, Math.min(100, score));
};

// ---------------------------------------------------------------------
//  MAIN METRICS GENERATOR – **NOW INCLUDES REAL CLARITY**
// ---------------------------------------------------------------------
export const generateMetrics = async (
  videoElement: HTMLVideoElement,
  audioLevel: number,          // 0-1 normalized (you already compute it)
  transcript: string
) => {
  console.log('Generating ML-based metrics (audioLevel, transcript length):', audioLevel, transcript.length);

  try {
    const facial = await analyzeFacialExpression(videoElement);
    const posture = await analyzePosture(videoElement);

    // **REAL CLARITY** – uses the live AudioAnalyzer
    const clarity = calculateVoiceClarity(transcript);

    const engagement = calculateEngagement(
      facial?.hasFace ?? false,
      transcript.length,
      audioLevel,
      facial?.emotions ?? [],
      facial?.eyeContact ?? 25
    );

    return {
      eyeContact: facial?.eyeContact ?? 25,
      posture: posture.posture,
      clarity,                                   // <-- NEW REAL VALUE
      engagement: Math.round(engagement),
      bodyLanguage: posture.bodyLanguage,
      emotions: facial?.emotions ?? [],
      imageData: facial?.imageData,
    };
  } catch (error) {
    console.error('Error generating metrics:', error);
    return {
      eyeContact: 25,
      posture: 50,
      clarity: 50,
      engagement: 25,
      bodyLanguage: 'neutral',
      emotions: [],
      imageData: null,
    };
  }
};

// ---------------------------------------------------------------------
//  CLEANUP (call when you stop the session)
// ---------------------------------------------------------------------
export const cleanupVision = () => {
  if (audioAnalyzer) {
    audioAnalyzer.cleanup();
    audioAnalyzer = null;
  }
};
