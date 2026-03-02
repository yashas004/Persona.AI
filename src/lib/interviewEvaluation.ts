import { SpeechAnalyzer } from './speechRecognition';

export type EvaluationResult = {
  contentScore: number;
  clarityScore: number;
  confidenceScore: number;
  overallScore: number;
  details?: any;
};

/**
 * Evaluate a single answer using simple keyword-matching + existing audio/vision analysis.
 * - expectedTopics: array of keywords to look for in the transcript
 * - transcript: recognized text
 * - videoElement: optional video element for vision analysis
 */
export async function evaluateAnswer(
  question: string,
  expectedTopics: string[] | undefined,
  transcript: string,
  videoElement?: HTMLVideoElement
): Promise<EvaluationResult> {
  const speech = new SpeechAnalyzer();
  const speechMetrics = speech.analyzeTranscript(transcript || '');

  // Content score: fraction of expected topics present
  let contentScore = 100;
  if (expectedTopics && expectedTopics.length > 0) {
    const text = (transcript || '').toLowerCase();
    const matches = expectedTopics.filter(t => text.includes(t.toLowerCase())).length;
    contentScore = Math.round((matches / expectedTopics.length) * 100);
  }

  // Clarity from speech analyzer (use articulationScore and clarityScore average)
  const clarityScore = Math.round(((speechMetrics.articulationScore || 0) + (speechMetrics.clarityScore || 0)) / 2);

  // Vision/Confidence: run a single frame analysis if videoElement provided
  let confidenceScore = 70; // default fallback
  if (videoElement) {
    try {
      // Dynamically import VisionAnalyzer to avoid loading heavy media libraries at module import time
      const mod = await import('./visionAnalysis');
      const VisionAnalyzer = mod.VisionAnalyzer;
      const v = new VisionAnalyzer();
      await v.initialize(videoElement);
      const metrics = await v.analyzeFrame(videoElement, Date.now());
      confidenceScore = Math.round(metrics.overallConfidence || 0);
    } catch (err) {
      console.warn('Vision analysis failed:', err);
    }
  }

  // Overall: weighted average
  const overall = Math.round((contentScore * 0.5) + (clarityScore * 0.3) + (confidenceScore * 0.2));

  return {
    contentScore,
    clarityScore,
    confidenceScore,
    overallScore: overall,
    details: { speechMetrics }
  };
}

export default evaluateAnswer;
