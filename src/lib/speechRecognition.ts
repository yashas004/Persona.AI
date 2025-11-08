// src/lib/speechRecognition.ts
export type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
export type ErrorCallback = (error: string) => void;

export class SpeechRecognitionService {
  private recognition: any;
  private isListening = false;
  private onTranscriptCallback: TranscriptCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  // Language map: short → Web Speech API code
  private readonly LANG_MAP: Record<string, string> = {
    en: "en-US",
    hi: "hi-IN",   // Hindi – Devanagari
    te: "te-IN",   // Telugu – Telugu script
  };

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    // Start with English – auto-switch later
    this.setLanguage("en");

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }

      // Auto language detection
      if (final) {
        const detected = this.detectLanguage(final);
        this.setLanguage(detected);
      }

      if (final && this.onTranscriptCallback) {
        this.onTranscriptCallback(final.trim(), true);
      } else if (interim && this.onTranscriptCallback) {
        this.onTranscriptCallback(interim.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      this.onErrorCallback?.(event.error);

      if (["no-speech", "audio-capture"].includes(event.error)) {
        setTimeout(() => {
          if (this.isListening) this.start();
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.recognition.start(), 100);
      }
    };
  }

  /** Public: set language manually (used by dropdown) */
  setLanguage(code: "en" | "hi" | "te" | string) {
    if (this.recognition) {
      const full = this.LANG_MAP[code] || code;
      this.recognition.lang = full;
    }
  }

  /** Detect language from text */
  private detectLanguage(text: string): string {
    if (/[\u0900-\u097F]/.test(text)) return "hi";
    if (/[\u0C00-\u0C7F]/.test(text)) return "te";
    return "en";
  }

  start() {
    if (!this.recognition) return false;
    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      return false;
    }
  }

  stop() {
    if (!this.recognition) return;
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (e) {
      console.error("Error stopping speech recognition:", e);
    }
  }

  onTranscript(cb: TranscriptCallback) {
    this.onTranscriptCallback = cb;
  }

  onError(cb: ErrorCallback) {
    this.onErrorCallback = cb;
  }

  isSupported() {
    return !!this.recognition;
  }
}

// Advanced speech pattern analysis with **multilingual filler detection**
export class SpeechAnalyzer {
  private wordTimestamps: Array<{ word: string; timestamp: number; isFiller: boolean }> = [];
  private lastWordTime = 0;
  private syllablePatterns = /[aeiouy]+/gi;

  // MULTILINGUAL FILLER WORDS
  private readonly FILLERS: Record<string, string[]> = {
    en: [
      // Basic fillers
      "um", "uh", "er", "ah", "hmm", "err", "emm", "ummm", "uhhh",

      // Common phrases
      "like", "you know", "i mean", "you see", "well", "so", "okay", "alright",
      "actually", "basically", "literally", "sort of", "kind of", "sorta", "kinda",
      "really", "very", "totally", "absolutely", "definitely", "probably", "maybe",
      "perhaps", "i think", "i guess", "i suppose", "you know what i mean",
      "does that make sense", "right", "okay", "alright", "sure", "yeah", "yep",
      "nope", "exactly", "precisely", "basically", "essentially", "fundamentally",
      "generally", "typically", "usually", "normally", "obviously", "clearly",
      "apparently", "apparently", "supposedly", "allegedly", "honestly", "frankly",
      "seriously", "truly", "really", "actually", "in fact", "as a matter of fact",
      "believe me", "trust me", "let me tell you", "you see", "look", "listen",
      "see", "check this out", "here's the thing", "the thing is", "the point is",
      "what i'm saying is", "what i mean is", "let me put it this way",
      "how can i put this", "it's like", "it's kind of like", "it's sort of like",
      "and stuff", "and things", "and whatever", "or something", "or whatever",
      "and so on", "et cetera", "etc", "and all that", "all that jazz",
      "you get the idea", "if you will", "so to speak", "in other words",
      "what i mean to say is", "the way i see it", "from my perspective",
      "in my opinion", "personally", "i believe", "i feel", "i reckon",
      "i'd say", "you might say", "some people say", "they say", "people say",
      "as they say", "so they say", "or so they say", "apparently", "seemingly",
      "ostensibly", "presumably", "supposedly", "reportedly", "allegedly"
    ],
    hi: [
      "toh", "matlab", "jaise", "waise", "umm", "basically",
      "actually", "toh phir", "kya", "arre", "woh", "haan"
    ],
    te: [
      "అంటే", "అయితే", "చూడు", "అవును", "అయ్యో", "అరె",
      "అందుకే", "అయిపోయింది", "అందరూ", "అది", "అలా"
    ],
  };

  // Keep English regex for extra safety
  private fillerPatterns = [
    /\b(um+|uh+|er+|ah+)\b/gi,
    /\b(like)\b(?!\s+(this|that|it))/gi,
    /\b(you know|i mean|sort of|kind of)\b/gi,
    /\b(actually|basically|literally)\b(?=\s+[a-z])/gi,
  ];

  analyzeTranscript(transcript: string) {
    let lang = "en";
    if (/[\u0900-\u097F]/.test(transcript)) lang = "hi";
    else if (/[\u0C00-\u0C7F]/.test(transcript)) lang = "te";

    const fillers = this.FILLERS[lang] || this.FILLERS.en;
    const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length);
    const now = Date.now();

    words.forEach(word => {
      const clean = word.replace(/[.,!?]/g, "");
      const isFiller = fillers.includes(clean) || this.isFillerWord(clean);
      this.wordTimestamps.push({ word: clean, timestamp: now, isFiller });
    });

    const cutoff = now - 60000;
    this.wordTimestamps = this.wordTimestamps.filter(w => w.timestamp > cutoff);

    const totalWords = this.wordTimestamps.length;
    const fillerCount = this.wordTimestamps.filter(w => w.isFiller).length;
    const fillerClusters = this.detectFillerClusters();

    const timeSpan = (now - (this.wordTimestamps[0]?.timestamp || now)) / 1000 / 60;
    const totalSyllables = this.estimateSyllables(this.wordTimestamps.map(w => w.word).join(" "));
    const wordsPerMinute = timeSpan > 0 ? Math.round(totalWords / timeSpan) : 0;
    const syllablesPerMinute = timeSpan > 0 ? Math.round(totalSyllables / timeSpan) : 0;
    const fillerPercentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;

    let paceScore = 100;
    if (wordsPerMinute < 100) paceScore -= (100 - wordsPerMinute) * 0.5;
    if (wordsPerMinute > 200) paceScore -= (wordsPerMinute - 200) * 0.5;
    paceScore = Math.max(25, Math.min(100, paceScore));

    const clarityScore = Math.max(25, 100 - fillerPercentage * 2);
    const fluencyScore = paceScore;
    const uniqueWords = new Set(this.wordTimestamps.map(w => w.word)).size;
    const wordDiversity = totalWords > 0 ? (uniqueWords / totalWords) * 100 : 0;

    // More realistic articulation score calculation
    // Articulation is about pronunciation clarity, not just vocabulary diversity
    // Base score starts lower and increases with speech quality factors
    let articulationBase = 60; // Base articulation score (realistic starting point)

    // Factor in word diversity (some influence, but not dominant)
    articulationBase += Math.min(wordDiversity * 0.3, 15); // Max +15 from diversity

    // Factor in speech consistency (lower fillers = better articulation)
    if (fillerPercentage < 5) articulationBase += 10;
    else if (fillerPercentage < 10) articulationBase += 5;
    else if (fillerPercentage > 20) articulationBase -= 5;

    // Factor in pace (moderate pace often indicates better articulation)
    if (wordsPerMinute >= 120 && wordsPerMinute <= 160) articulationBase += 5;
    else if (wordsPerMinute < 100 || wordsPerMinute > 200) articulationBase -= 5;

    // Articulation should rarely exceed 95% (perfect articulation is nearly impossible)
    const articulationScore = Math.max(25, Math.min(95, articulationBase));

    return {
      wordsPerMinute,
      syllablesPerMinute,
      fillerCount,
      fillerPercentage: Math.round(fillerPercentage),
      fillerClusters,
      totalWords,
      paceScore: Math.round(paceScore),
      clarityScore: Math.round(clarityScore),
      fluencyScore: Math.round(fluencyScore),
      articulationScore: Math.round(articulationScore),
      feedback: this.generateFeedback(wordsPerMinute, fillerPercentage, wordDiversity),
    };
  }

  private generateFeedback(wpm: number, fillerPct: number, diversity: number): string {
    const feedback: string[] = [];
    if (wpm < 100) feedback.push("Try to speak a bit faster - aim for 120-150 words per minute.");
    else if (wpm > 200) feedback.push("Slow down slightly - speaking too fast can reduce clarity.");
    else feedback.push("Good speaking pace!");

    if (fillerPct > 10) feedback.push("Reduce filler words by pausing instead.");
    else if (fillerPct < 5) feedback.push("Excellent - minimal filler words!");

    if (diversity < 0.3) feedback.push("Try to use more varied vocabulary.");
    return feedback.join(" ");
  }

  private isFillerWord(word: string): boolean {
    return this.fillerPatterns.some(p => p.test(word));
  }

  private detectFillerClusters(): number {
    let clusters = 0, consecutive = 0;
    for (const w of this.wordTimestamps) {
      if (w.isFiller) {
        consecutive++;
        if (consecutive >= 2) { clusters++; consecutive = 0; }
      } else consecutive = 0;
    }
    return clusters;
  }

  private estimateSyllables(text: string): number {
    if (!text) return 0;
    const words = text.toLowerCase().split(/\s+/);
    let total = 0;
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, "");
      if (!clean) continue;
      const matches = clean.match(this.syllablePatterns);
      let syllables = matches ? matches.length : 1;
      if (clean.endsWith("e") && syllables > 1) syllables--;
      total += Math.max(1, syllables);
    }
    return total;
  }

  getMetrics() { return this.analyzeTranscript(""); }
  reset() { this.wordTimestamps = []; this.lastWordTime = 0; }
}
