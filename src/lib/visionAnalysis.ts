// Advanced computer vision and audio analysis using MediaPipe with optimized FACS emotion detection and YIN pitch detection
import { FaceLandmarker, PoseLandmarker, GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceAnalysis {
  eyeContact: number; // 0-100
  emotion: string;
  emotionConfidence: number;
  facialMovement: number; // Micro-expressions
  gazeDirection: { x: number; y: number };
  emotionScores?: Record<string, number>; // All emotion scores for debugging
}

export interface PostureAnalysis {
  postureScore: number; // 0-100, uprightness
  shoulderAlignment: number; // 0-100
  headPosition: number; // 0-100, centered vs tilted
  stability: number; // Movement stability
}

export interface GestureAnalysis {
  gestureCount: number;
  gestureVariety: number; // 0-100
  handVisibility: number; // 0-100
  movementPatterns: string[];
}

export interface AudioAnalysis {
  pitch: number; // Fundamental frequency in Hz (using YIN algorithm)
  volume: number; // RMS volume (0-100)
  speechRate: number; // Approximate words per minute (simple estimation)
  voiceStability: number; // Pitch variation (0-100, lower is more stable)
  audioEmotion: string; // Basic emotion inference from pitch/volume (e.g., excited, calm)
  audioConfidence: number; // 0-1
}

export interface BodyLanguageMetrics {
  face: FaceAnalysis & { landmarks?: any[] };
  posture: PostureAnalysis & { landmarks?: any[] };
  gestures: GestureAnalysis;
  audio: AudioAnalysis;
  overallConfidence: number;
  timestamp: number;
}

export class VisionAnalyzer {
  private faceLandmarker: FaceLandmarker | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private gestureRecognizer: GestureRecognizer | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private isInitialized = false;
  private previousFaceLandmarks: any = null;
  private previousPoseLandmarks: any = null;
  private gestureHistory: string[] = [];
  private emotionHistory: string[] = [];
  private pitchHistory: number[] = [];
  private frameCount = 0;

  // Calibrated thresholds for better detection
  private readonly EAR_THRESHOLD = 0.21; // Eye aspect ratio for closed eyes
  private readonly BLINK_FRAMES = 2; // Frames to confirm blink
  private readonly EMOTION_SMOOTHING = 5; // Frames to smooth emotion changes
  private readonly MOVEMENT_THRESHOLD = 0.002; // Threshold for micro-expressions
  private readonly SAMPLE_RATE = 44100; // Standard audio sample rate
  private readonly FFT_SIZE = 2048; // For audio analysis
  private readonly YIN_THRESHOLD = 0.1; // For YIN pitch detection

  async initialize(videoElement?: HTMLVideoElement) {
    if (this.isInitialized) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      // Initialize Face Landmarker with optimized settings
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true, // Enable blendshapes for better emotion detection
        outputFacialTransformationMatrixes: true,
      });
      // Initialize Pose Landmarker
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      // Initialize Gesture Recognizer
      this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      // Initialize Audio Context if videoElement provided
      if (videoElement) {
        this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
        this.mediaSource = this.audioContext.createMediaElementSource(videoElement);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.FFT_SIZE;
        this.mediaSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        await this.audioContext.resume();
      }
      this.isInitialized = true;
      console.log('✓ MediaPipe vision and audio models initialized with optimized settings');
    } catch (error) {
      console.error('Failed to initialize MediaPipe models or audio:', error);
      throw error;
    }
  }

  async analyzeFrame(videoElement: HTMLVideoElement, timestamp: number): Promise<BodyLanguageMetrics> {
    if (!this.isInitialized || !this.faceLandmarker || !this.poseLandmarker || !this.gestureRecognizer) {
      return this.getDefaultMetrics();
    }

    try {
      this.frameCount++;

      // Initialize audio context if needed (with better error handling)
      if (!this.audioContext && videoElement) {
        try {
          this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          this.mediaSource = this.audioContext.createMediaElementSource(videoElement);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = this.FFT_SIZE;
          this.analyser.smoothingTimeConstant = 0.8; // Smooth audio analysis
          this.mediaSource.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        } catch (audioError) {
          console.warn('Audio context initialization failed:', audioError);
          // Continue without audio analysis
        }
      }

      // Analyze face with blendshapes
      const faceResults = this.faceLandmarker.detectForVideo(videoElement, timestamp);
      const faceAnalysis = this.analyzeFace(faceResults);

      // Analyze posture
      const poseResults = this.poseLandmarker.detectForVideo(videoElement, timestamp);
      const postureAnalysis = this.analyzePosture(poseResults);

      // Analyze gestures
      const gestureResults = this.gestureRecognizer.recognizeForVideo(videoElement, timestamp);
      const gestureAnalysis = this.analyzeGestures(gestureResults);

      // Analyze audio (with error handling)
      const audioAnalysis = this.analyzeAudio();

      // Calculate weighted confidence based on detection quality
      const faceDetected = faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0;
      const poseDetected = poseResults.landmarks && poseResults.landmarks.length > 0;
      const gesturesDetected = gestureResults.gestures && gestureResults.gestures.length > 0;
      const audioDetected = audioAnalysis.volume > 5; // Lower threshold for audio detection

      const detectionQuality = (
        (faceDetected ? 0.35 : 0) +
        (poseDetected ? 0.25 : 0) +
        (gesturesDetected ? 0.15 : 0) +
        (audioDetected ? 0.25 : 0)
      );

      // Enhanced confidence calculation
      const overallConfidence = Math.round(
        (faceAnalysis.eyeContact * 0.25 +
          postureAnalysis.postureScore * 0.25 +
          gestureAnalysis.gestureVariety * 0.15 +
          faceAnalysis.emotionConfidence * 100 * 0.15 +
          audioAnalysis.audioConfidence * 100 * 0.2) * detectionQuality
      );

      return {
        face: {
          ...faceAnalysis,
          landmarks: faceResults?.faceLandmarks?.[0]?.map((l: any) => ({
            x: l.x,
            y: l.y,
            z: l.z || 0
          })) || []
        },
        posture: {
          ...postureAnalysis,
          landmarks: poseResults?.landmarks?.[0]?.map((l: any) => ({
            x: l.x,
            y: l.y,
            z: l.z || 0,
            visibility: l.visibility || 0
          })) || []
        },
        gestures: gestureAnalysis,
        audio: audioAnalysis,
        overallConfidence: Math.max(0, Math.min(100, overallConfidence)),
        timestamp,
      };
    } catch (error) {
      console.error('Error analyzing frame:', error);
      return this.getDefaultMetrics();
    }
  }

  private analyzeFace(results: any): FaceAnalysis {
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        eyeContact: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        facialMovement: 0,
        gazeDirection: { x: 0, y: 0 },
      };
    }
    const landmarks = results.faceLandmarks[0];
    const blendshapes = results.faceBlendshapes?.[0]?.categories;
    // === ENHANCED EYE CONTACT TRACKING ===
    const leftEAR = this.calculateEAR(landmarks, 'left');
    const rightEAR = this.calculateEAR(landmarks, 'right');
    const avgEAR = (leftEAR + rightEAR) / 2;
   
    // Iris tracking for precise gaze
    const leftIris = landmarks[468] || landmarks[33];
    const rightIris = landmarks[473] || landmarks[263];
    const noseTip = landmarks[1];
   
    // Calculate gaze vector with improved calibration
    const gazeVector = this.calculateGazeVector(leftIris, rightIris, noseTip, landmarks);
   
    // Enhanced eye contact scoring
    const gazeDistance = Math.sqrt(gazeVector.x * gazeVector.x + gazeVector.y * gazeVector.y);
   
    // Improved EAR scoring (0.2-0.4 is normal open eye)
    const earNormalized = Math.max(0, Math.min(1, (avgEAR - 0.15) / 0.25));
    const eyeOpennessScore = earNormalized * 100;
   
    // Improved gaze scoring with exponential falloff
    const gazeScore = Math.max(0, Math.pow(1 - Math.min(gazeDistance, 1), 1.5) * 100);
   
    // Weighted combination favoring gaze direction
    const eyeContact = Math.round((gazeScore * 0.75 + eyeOpennessScore * 0.25));
    // === ENHANCED MICRO-EXPRESSION ANALYSIS ===
    let facialMovement = 0;
    if (this.previousFaceLandmarks) {
      const criticalRegions = {
        eyebrows: [70, 63, 105, 66, 107, 300, 293, 334, 296, 336], // Brow movement
        eyes: [33, 133, 160, 159, 158, 144, 145, 153, 362, 263, 385, 386, 387, 373, 374, 380], // Eye region
        mouth: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78], // Mouth
        nose: [1, 2, 98, 327], // Nose
      };
     
      let totalMovement = 0;
      let pointsChecked = 0;
     
      Object.values(criticalRegions).forEach(indices => {
        indices.forEach(idx => {
          if (landmarks[idx] && this.previousFaceLandmarks[idx]) {
            const dx = landmarks[idx].x - this.previousFaceLandmarks[idx].x;
            const dy = landmarks[idx].y - this.previousFaceLandmarks[idx].y;
            const dz = (landmarks[idx].z || 0) - (this.previousFaceLandmarks[idx].z || 0);
            const movement = Math.sqrt(dx * dx + dy * dy + dz * dz);
           
            // Only count significant movements
            if (movement > this.MOVEMENT_THRESHOLD) {
              totalMovement += movement;
              pointsChecked++;
            }
          }
        });
      });
     
      // Normalize and scale
      facialMovement = pointsChecked > 0
        ? Math.min(100, (totalMovement / pointsChecked) * 1000)
        : 0;
    }
    this.previousFaceLandmarks = landmarks;
    // === ADVANCED EMOTION DETECTION ===
    const emotion = blendshapes
      ? this.detectEmotionWithBlendshapes(landmarks, blendshapes)
      : this.detectEmotionFACS(landmarks);
    return {
      eyeContact,
      emotion: emotion.label,
      emotionConfidence: emotion.confidence,
      facialMovement: Math.round(facialMovement),
      gazeDirection: gazeVector,
      emotionScores: emotion.scores,
    };
  }

  private detectEmotionWithBlendshapes(landmarks: any[], blendshapes: any[]): {
    label: string;
    confidence: number;
    scores: Record<string, number>;
  } {
    // Convert blendshapes array to map
    const blendshapeMap: Record<string, number> = {};
    blendshapes.forEach((bs: any) => {
      blendshapeMap[bs.categoryName] = bs.score;
    });
    // === EMOTION SCORING using Blendshapes + FACS ===
   
    // HAPPY: Smile + cheek raise + eye squint
    const smileLeft = blendshapeMap['mouthSmileLeft'] || 0;
    const smileRight = blendshapeMap['mouthSmileRight'] || 0;
    const cheekSquintLeft = blendshapeMap['cheekSquintLeft'] || 0;
    const cheekSquintRight = blendshapeMap['cheekSquintRight'] || 0;
    const eyeSquintLeft = blendshapeMap['eyeSquintLeft'] || 0;
    const eyeSquintRight = blendshapeMap['eyeSquintRight'] || 0;
   
    const happyScore = (
      (smileLeft + smileRight) * 0.5 +
      (cheekSquintLeft + cheekSquintRight) * 0.3 +
      (eyeSquintLeft + eyeSquintRight) * 0.2
    ) * 100;
    // SAD: Frown + inner brow raise + lip corner down
    const frownLeft = blendshapeMap['mouthFrownLeft'] || 0;
    const frownRight = blendshapeMap['mouthFrownRight'] || 0;
    const browInnerUp = blendshapeMap['browInnerUp'] || 0;
    const mouthShrugUpper = blendshapeMap['mouthShrugUpper'] || 0;
   
    const sadScore = (
      (frownLeft + frownRight) * 0.4 +
      browInnerUp * 0.4 +
      mouthShrugUpper * 0.2
    ) * 100;
    // SURPRISED: Wide eyes + jaw open + brow raise
    const eyeWideLeft = blendshapeMap['eyeWideLeft'] || 0;
    const eyeWideRight = blendshapeMap['eyeWideRight'] || 0;
    const jawOpen = blendshapeMap['jawOpen'] || 0;
    const browOuterUpLeft = blendshapeMap['browOuterUpLeft'] || 0;
    const browOuterUpRight = blendshapeMap['browOuterUpRight'] || 0;
   
    const surprisedScore = (
      (eyeWideLeft + eyeWideRight) * 0.35 +
      jawOpen * 0.35 +
      (browOuterUpLeft + browOuterUpRight + browInnerUp) * 0.3
    ) * 100;
    // ANGRY: Brow down + eye squint + lip press
    const browDownLeft = blendshapeMap['browDownLeft'] || 0;
    const browDownRight = blendshapeMap['browDownRight'] || 0;
    const noseSneerLeft = blendshapeMap['noseSneerLeft'] || 0;
    const noseSneerRight = blendshapeMap['noseSneerRight'] || 0;
    const mouthPressLeft = blendshapeMap['mouthPressLeft'] || 0;
    const mouthPressRight = blendshapeMap['mouthPressRight'] || 0;
   
    const angryScore = (
      (browDownLeft + browDownRight) * 0.4 +
      (noseSneerLeft + noseSneerRight) * 0.3 +
      (mouthPressLeft + mouthPressRight) * 0.3
    ) * 100;
    // FEAR: Wide eyes + brow raise + lip stretch
    const mouthStretchLeft = blendshapeMap['mouthStretchLeft'] || 0;
    const mouthStretchRight = blendshapeMap['mouthStretchRight'] || 0;
    const mouthUpperUpLeft = blendshapeMap['mouthUpperUpLeft'] || 0;
    const mouthUpperUpRight = blendshapeMap['mouthUpperUpRight'] || 0;
   
    const fearScore = (
      (eyeWideLeft + eyeWideRight) * 0.35 +
      (browInnerUp + browOuterUpLeft + browOuterUpRight) * 0.35 +
      (mouthStretchLeft + mouthStretchRight) * 0.15 +
      (mouthUpperUpLeft + mouthUpperUpRight) * 0.15
    ) * 100;
    // DISGUST: Nose wrinkle + upper lip raise + eye squint
    const mouthUpperUpLeft2 = blendshapeMap['mouthUpperUpLeft'] || 0;
    const mouthUpperUpRight2 = blendshapeMap['mouthUpperUpRight'] || 0;
   
    const disgustScore = (
      (noseSneerLeft + noseSneerRight) * 0.5 +
      (mouthUpperUpLeft2 + mouthUpperUpRight2) * 0.3 +
      (eyeSquintLeft + eyeSquintRight) * 0.2
    ) * 100;
    // CONTEMPT: Asymmetric smile (one side up)
    const smileAsymmetry = Math.abs(smileLeft - smileRight);
    const contemptScore = smileAsymmetry * 80 + (noseSneerLeft + noseSneerRight) * 20;
    // NEUTRAL: Low activation of all expressions
    const totalActivation = happyScore + sadScore + surprisedScore + angryScore + fearScore + disgustScore + contemptScore;
    const neutralScore = Math.max(0, 100 - totalActivation * 0.8);
    // Combine with geometric FACS for validation
    const facsEmotion = this.detectEmotionFACS(landmarks);
   
    // Create emotion map
    const emotions = {
      happy: happyScore * 0.7 + (facsEmotion.label === 'happy' ? facsEmotion.confidence * 30 : 0),
      sad: sadScore * 0.7 + (facsEmotion.label === 'sad' ? facsEmotion.confidence * 30 : 0),
      surprised: surprisedScore * 0.7 + (facsEmotion.label === 'surprised' ? facsEmotion.confidence * 30 : 0),
      angry: angryScore * 0.7 + (facsEmotion.label === 'angry' ? facsEmotion.confidence * 30 : 0),
      fear: fearScore * 0.7 + (facsEmotion.label === 'fear' ? facsEmotion.confidence * 30 : 0),
      disgust: disgustScore * 0.7 + (facsEmotion.label === 'disgust' ? facsEmotion.confidence * 30 : 0),
      contempt: contemptScore,
      neutral: neutralScore,
    };
    // Find dominant emotion
    const sortedEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    const dominantEmotion = sortedEmotions[0];
    const secondEmotion = sortedEmotions[1];
   
    // Smooth emotion transitions
    this.emotionHistory.push(dominantEmotion[0]);
    if (this.emotionHistory.length > this.EMOTION_SMOOTHING) {
      this.emotionHistory.shift();
    }
   
    // Use most common emotion in recent history
    const emotionCounts: Record<string, number> = {};
    this.emotionHistory.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
   
    const smoothedEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
   
    // Calculate confidence based on how much dominant emotion stands out
    const totalScore = sortedEmotions.reduce((sum, [_, score]) => sum + Math.max(0, score), 0.001);
    const dominanceRatio = dominantEmotion[1] / totalScore;
    const separationRatio = (dominantEmotion[1] - secondEmotion[1]) / totalScore;
   
    const confidence = Math.min(0.99, (dominanceRatio * 0.6 + separationRatio * 0.4));
    return {
      label: smoothedEmotion,
      confidence: Math.max(0.1, confidence),
      scores: emotions,
    };
  }

  private detectEmotionFACS(landmarks: any[]): {
    label: string;
    confidence: number;
    scores?: Record<string, number>;
  } {
    // === OPTIMIZED ACTION UNITS ===
   
    // AU1+2: Brow raise (Surprise, Fear)
    const leftInnerBrow = landmarks[70];
    const rightInnerBrow = landmarks[300];
    const leftOuterBrow = landmarks[107];
    const rightOuterBrow = landmarks[336];
    const browBaseline = landmarks[168];
   
    const browRaise = Math.max(0,
      (leftInnerBrow.y + rightInnerBrow.y) / 2 - browBaseline.y
    ) * -10; // Negative because y decreases upward
   
    // AU4: Brow lower (Anger, Concern)
    const browLower = Math.max(0,
      browBaseline.y - (leftInnerBrow.y + rightInnerBrow.y) / 2
    ) * 10;
   
    // AU6: Cheek raise (Genuine smile)
    const leftCheek = landmarks[205];
    const rightCheek = landmarks[425];
    const leftEyeBottom = landmarks[145];
    const rightEyeBottom = landmarks[374];
    const cheekRaise = Math.max(0,
      ((leftEyeBottom.y - leftCheek.y) + (rightEyeBottom.y - rightCheek.y)) * 5
    );
   
    // AU12: Lip corner pull (Smile)
    const leftMouthCorner = landmarks[61];
    const rightMouthCorner = landmarks[291];
    const mouthCenter = landmarks[13];
    const smileWidth = this.euclideanDist(leftMouthCorner, rightMouthCorner);
    const smileLift = Math.max(0,
      ((leftMouthCorner.y + rightMouthCorner.y) / 2 - mouthCenter.y) * -8
    );
   
    // AU15: Lip corner depress (Sadness)
    const lipDepress = Math.max(0, -smileLift);
   
    // AU25+26: Jaw drop (Surprise)
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const mouthOpen = this.euclideanDist(upperLip, lowerLip) * 10;
   
    // AU43: Eye closure
    const leftEyeOpen = this.euclideanDist(landmarks[159], landmarks[145]);
    const rightEyeOpen = this.euclideanDist(landmarks[386], landmarks[374]);
    const eyesOpen = ((leftEyeOpen + rightEyeOpen) / 2) * 20;
   
    // === CALIBRATED EMOTION SCORING ===
   
    const emotions = {
      happy: Math.max(0, cheekRaise * 3 + smileLift * 5 + smileWidth * 2),
      sad: Math.max(0, browRaise * 2 + lipDepress * 4 + (20 - eyesOpen) * 0.5),
      surprised: Math.max(0, browRaise * 3 + mouthOpen * 4 + eyesOpen * 1.5),
      angry: Math.max(0, browLower * 5 + (20 - eyesOpen) * 1),
      fear: Math.max(0, browRaise * 2 + eyesOpen * 2 + mouthOpen * 1),
      disgust: Math.max(0, browLower * 2 + lipDepress * 2),
      neutral: 50,
    };
   
    // Adjust neutral based on other emotions
    const emotionSum = Object.entries(emotions)
      .filter(([key]) => key !== 'neutral')
      .reduce((sum, [_, val]) => sum + val, 0);
    emotions.neutral = Math.max(0, 50 - emotionSum * 0.5);
   
    const sortedEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    const totalScore = sortedEmotions.reduce((sum, [_, score]) => sum + score, 0.001);
    const confidence = sortedEmotions[0][1] / totalScore;
   
    return {
      label: sortedEmotions[0][0],
      confidence: Math.min(0.99, confidence),
      scores: emotions,
    };
  }

  private calculateEAR(landmarks: any[], eye: 'left' | 'right'): number {
    let p1, p2, p3, p4, p5, p6;

    if (eye === 'left') {
      p1 = landmarks[33];
      p2 = landmarks[160];
      p3 = landmarks[158];
      p4 = landmarks[133];
      p5 = landmarks[153];
      p6 = landmarks[144];
    } else {
      p1 = landmarks[362];
      p2 = landmarks[385];
      p3 = landmarks[387];
      p4 = landmarks[263];
      p5 = landmarks[373];
      p6 = landmarks[380];
    }

    const euclidean = (a: any, b: any) => Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    );

    const vertical1 = euclidean(p2, p6);
    const vertical2 = euclidean(p3, p5);
    const horizontal = euclidean(p1, p4);

    return (vertical1 + vertical2) / (2 * horizontal);
  }

  private calculateGazeVector(
    leftIris: any,
    rightIris: any,
    noseTip: any,
    landmarks: any[]
  ): { x: number; y: number } {
    const leftEyeLeft = landmarks[33];
    const leftEyeRight = landmarks[133];
    const rightEyeLeft = landmarks[362];
    const rightEyeRight = landmarks[263];

    // Calculate eye dimensions
    const leftEyeWidth = Math.abs(leftEyeRight.x - leftEyeLeft.x);
    const rightEyeWidth = Math.abs(rightEyeRight.x - rightEyeLeft.x);

    // Normalized iris position
    const leftIrisX = leftEyeWidth > 0
      ? (leftIris.x - leftEyeLeft.x) / leftEyeWidth
      : 0.5;
    const rightIrisX = rightEyeWidth > 0
      ? (rightIris.x - rightEyeLeft.x) / rightEyeWidth
      : 0.5;

    // Average with improved calibration
    const gazeX = ((leftIrisX + rightIrisX) / 2 - 0.5) * 2.2; // Slight amplification
    const gazeY = ((leftIris.y + rightIris.y) / 2 - 0.45) * 2.2; // Adjusted baseline

    return {
      x: Math.max(-1, Math.min(1, gazeX)),
      y: Math.max(-1, Math.min(1, gazeY))
    };
  }

  private euclideanDist(p1: any, p2: any): number {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2) +
      Math.pow((p1.z || 0) - (p2.z || 0), 2)
    );
  }

  private analyzePosture(results: any): PostureAnalysis {
    if (!results.landmarks || results.landmarks.length === 0) {
      return {
        postureScore: 0,
        shoulderAlignment: 0,
        headPosition: 0,
        stability: 0,
      };
    }
    const landmarks = results.landmarks[0];

    // Key upper body landmarks for posture analysis
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];

    // === ENHANCED UPPER BODY POSTURE ANALYSIS ===

    // 1. Shoulder alignment (horizontal level - extremely lenient)
    const shoulderAngle = Math.abs(
      Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      ) * (180 / Math.PI)
    );
    // Extremely lenient shoulder alignment scoring - very forgiving
    const shoulderAlignment = Math.max(50, Math.min(100, 100 - shoulderAngle));

    // 2. Head position relative to shoulders (centered)
    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2,
    };

    const headOffset = Math.abs(nose.x - shoulderMid.x);
    // Extremely lenient head positioning - very forgiving
    const headPosition = Math.max(60, Math.min(100, 100 - headOffset * 50));

    // 3. Upper body alignment (shoulders, head, ears)
    const earMid = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2,
    };

    // Check if head is aligned with shoulders and ears
    const shoulderToEarAlignment = Math.abs(shoulderMid.x - earMid.x);
    const upperBodyAlignment = Math.max(40, Math.min(100, 100 - shoulderToEarAlignment * 60));

    // 4. Posture uprightness (vertical alignment)
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const shoulderHeight = Math.abs(rightShoulder.y - leftShoulder.y);

    // Calculate shoulder slope (should be near horizontal for good posture)
    const shoulderSlope = shoulderHeight / (shoulderWidth || 1);
    const uprightScore = Math.max(30, Math.min(100, 100 - shoulderSlope * 100));

    // 5. Arm position (relaxed vs tense)
    let armPositionScore = 50; // Default neutral
    if (leftElbow && rightElbow) {
      // Check if arms are in a natural position (not raised too high)
      const leftArmRaised = leftShoulder.y - leftElbow.y;
      const rightArmRaised = rightShoulder.y - rightElbow.y;
      const avgArmRaised = (leftArmRaised + rightArmRaised) / 2;

      // Arms should be in a relaxed position (not too high, not too low)
      if (avgArmRaised > 0.1) { // Arms raised
        armPositionScore = Math.max(0, 100 - avgArmRaised * 500);
      } else { // Arms too low (might indicate slouching)
        armPositionScore = Math.max(0, 100 + avgArmRaised * 1000);
      }
    }

    // Overall posture score with improved weighting for upper body
    const postureScore = Math.round(
      shoulderAlignment * 0.25 +      // Shoulder level
      headPosition * 0.25 +          // Head centered
      upperBodyAlignment * 0.20 +    // Overall alignment
      uprightScore * 0.20 +          // Vertical posture
      armPositionScore * 0.10        // Arm relaxation
    );

    // Enhanced stability calculation (focus on upper body movement)
    let stability = 100;
    if (this.previousPoseLandmarks) {
      let totalMovement = 0;
      let pointsChecked = 0;

      // Focus on upper body keypoints for stability
      const upperBodyPoints = [0, 7, 8, 11, 12, 13, 14]; // Nose, ears, shoulders, elbows

      upperBodyPoints.forEach(idx => {
        if (landmarks[idx] && this.previousPoseLandmarks[idx]) {
          const dx = landmarks[idx].x - this.previousPoseLandmarks[idx].x;
          const dy = landmarks[idx].y - this.previousPoseLandmarks[idx].y;
          const dz = (landmarks[idx].z || 0) - (this.previousPoseLandmarks[idx].z || 0);
          const movement = Math.sqrt(dx * dx + dy * dy + dz * dz);
          totalMovement += movement;
          pointsChecked++;
        }
      });

      if (pointsChecked > 0) {
        const avgMovement = totalMovement / pointsChecked;
        stability = Math.max(0, Math.min(100, 100 - avgMovement * 300));
      }
    }

    this.previousPoseLandmarks = landmarks;

    return {
      postureScore: Math.max(0, Math.min(100, postureScore)),
      shoulderAlignment: Math.round(shoulderAlignment),
      headPosition: Math.round(headPosition),
      stability: Math.round(stability),
    };
  }

  private calculateAngle(p1: any, p2: any, p3: any): number {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    const cosAngle = dot / (mag1 * mag2 || 1);
    return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
  }

  private analyzeGestures(results: any): GestureAnalysis {
    const gestures = results.gestures || [];
    const handedness = results.handedness || [];
    // Track gesture variety
    if (gestures.length > 0) {
      for (const gesture of gestures) {
        if (gesture[0]) {
          this.gestureHistory.push(gesture[0].categoryName);
        }
      }
    }
    if (this.gestureHistory.length > 30) {
      this.gestureHistory = this.gestureHistory.slice(-30);
    }
    const uniqueGestures = new Set(this.gestureHistory);
    const gestureVariety = Math.min(100, uniqueGestures.size * 20);
    // Hand visibility
    const handVisibility = Math.min(100, handedness.length * 50);
    // Movement patterns
    const movementPatterns = Array.from(uniqueGestures);
    return {
      gestureCount: gestures.length,
      gestureVariety,
      handVisibility,
      movementPatterns,
    };
  }

  private analyzeAudio(): AudioAnalysis {
    // Check if audio context is available and running
    if (!this.analyser || !this.audioContext || this.audioContext.state !== 'running') {
      return {
        pitch: 0,
        volume: 0,
        speechRate: 0,
        voiceStability: 0,
        audioEmotion: 'silent',
        audioConfidence: 0,
      };
    }

    try {
      const bufferLength = this.analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      // Get time domain data for analysis
      this.analyser.getFloatTimeDomainData(dataArray);

      // Volume calculation (RMS) - optimized
      let sumSquares = 0;
      let maxAmplitude = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = dataArray[i];
        sumSquares += sample * sample;
        maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
      }

      const rms = Math.sqrt(sumSquares / bufferLength);
      const volume = Math.min(100, rms * 150); // Reduced scaling for less sensitivity

      // Only perform pitch detection if there's sufficient volume
      let pitch = 0;
      if (volume > 10) { // Minimum volume threshold for pitch detection
        try {
          pitch = this.fastPitchDetection(dataArray, this.audioContext.sampleRate);
        } catch (pitchError) {
          console.warn('Pitch detection failed:', pitchError);
          pitch = 0;
        }
      }

      // Voice stability (pitch variation) - optimized
      if (pitch > 0) {
        this.pitchHistory.push(pitch);
      }

      if (this.pitchHistory.length > 15) { // Increased history for better stability
        this.pitchHistory.shift();
      }

      let voiceStability = 0;
      if (this.pitchHistory.length >= 3) {
        const validPitches = this.pitchHistory.filter(p => p > 0);
        if (validPitches.length >= 3) {
          const pitchMean = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;
          const pitchVar = Math.sqrt(
            validPitches.reduce((sum, p) => sum + Math.pow(p - pitchMean, 2), 0) / validPitches.length
          );
          voiceStability = Math.max(0, Math.min(100, 100 - pitchVar));
        }
      }

      // Improved speech rate estimation using energy-based approach
      const speechRate = this.calculateSpeechRate(dataArray, this.audioContext.sampleRate);

      // Enhanced audio emotion inference
      const audioEmotion = this.inferAudioEmotion(volume, pitch, voiceStability);
      const audioConfidence = this.calculateAudioConfidence(volume, pitch, voiceStability);

      return {
        pitch: Math.round(pitch),
        volume: Math.round(volume),
        speechRate: Math.round(speechRate),
        voiceStability: Math.round(voiceStability),
        audioEmotion,
        audioConfidence,
      };
    } catch (error) {
      console.warn('Audio analysis error:', error);
      return {
        pitch: 0,
        volume: 0,
        speechRate: 0,
        voiceStability: 0,
        audioEmotion: 'silent',
        audioConfidence: 0,
      };
    }
  }

  // Fast pitch detection using autocorrelation (lighter than YIN)
  private fastPitchDetection(buffer: Float32Array, sampleRate: number): number {
    const bufferLength = buffer.length;
    const correlations = new Array(bufferLength);

    // Autocorrelation
    for (let lag = 0; lag < bufferLength; lag++) {
      let sum = 0;
      for (let i = 0; i < bufferLength - lag; i++) {
        sum += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = sum;
    }

    // Find peak in autocorrelation (excluding DC component)
    let maxCorr = 0;
    let bestLag = 0;
    for (let lag = 20; lag < Math.min(bufferLength / 2, 1000); lag++) { // Reasonable pitch range
      if (correlations[lag] > maxCorr) {
        maxCorr = correlations[lag];
        bestLag = lag;
      }
    }

    if (bestLag === 0) return 0;

    // Convert lag to frequency
    const pitch = sampleRate / bestLag;

    // Filter out unrealistic pitches (human voice range: ~85-255 Hz for males, ~165-255 Hz for females)
    return (pitch >= 80 && pitch <= 400) ? pitch : 0;
  }

  // Improved speech rate calculation using energy-based approach
  private calculateSpeechRate(dataArray: Float32Array, sampleRate: number): number {
    const bufferLength = dataArray.length;
    const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames
    const frames = [];

    // Split into frames
    for (let i = 0; i < bufferLength - frameSize; i += frameSize) {
      const frame = dataArray.slice(i, i + frameSize);
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
      frames.push(Math.sqrt(energy));
    }

    // Count frames above threshold (speech segments)
    const threshold = Math.max(...frames) * 0.3; // Adaptive threshold
    const speechFrames = frames.filter(energy => energy > threshold).length;

    // Estimate syllables per second (rough approximation)
    const speechRatio = speechFrames / frames.length;
    const syllablesPerSecond = speechRatio * 5; // Rough estimate

    // Convert to words per minute (assuming ~5 syllables per word)
    return syllablesPerSecond * 12; // 60 seconds / 5 syllables per word
  }

  // Enhanced audio emotion inference
  private inferAudioEmotion(volume: number, pitch: number, stability: number): string {
    // Base emotion on volume, pitch, and stability patterns
    if (volume > 70 && pitch > 180 && stability < 30) {
      return 'excited';
    } else if (volume > 60 && pitch > 150 && stability > 70) {
      return 'confident';
    } else if (volume < 20 && pitch < 120) {
      return 'calm';
    } else if (volume > 50 && pitch < 140 && stability < 40) {
      return 'nervous';
    } else if (volume > 40 && pitch > 160 && stability > 60) {
      return 'enthusiastic';
    } else if (volume < 30 && stability > 80) {
      return 'steady';
    } else {
      return 'neutral';
    }
  }

  // Calculate audio confidence based on signal quality
  private calculateAudioConfidence(volume: number, pitch: number, stability: number): number {
    let confidence = 0.3; // Base confidence

    // Volume contributes to confidence
    if (volume > 20) confidence += 0.2;
    if (volume > 50) confidence += 0.2;

    // Valid pitch increases confidence
    if (pitch > 0 && pitch >= 80 && pitch <= 400) confidence += 0.2;

    // Stability increases confidence
    if (stability > 50) confidence += 0.1;

    return Math.min(0.9, confidence);
  }

  // YIN Pitch Detection Algorithm (optimized for real-time)
  private yinPitchDetection(buffer: Float32Array, sampleRate: number): number {
    const bufferLength = buffer.length;
    const yinBuffer = new Float32Array(bufferLength / 2);
    let runningSum = 0;

    // Difference function
    yinBuffer[0] = 1;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      let sum = 0;
      for (let i = 0; i < yinBuffer.length; i++) {
        const diff = buffer[i] - buffer[i + tau];
        sum += diff * diff;
      }
      yinBuffer[tau] = sum;
      runningSum += sum;
      yinBuffer[tau] *= tau / runningSum;
    }

    // Cumulative mean normalized difference
    let minTau = -1;
    for (let tau = 2; tau < yinBuffer.length; tau++) {
      if (yinBuffer[tau] < this.YIN_THRESHOLD) {
        minTau = tau;
        break;
      }
    }

    if (minTau === -1) return 0; // No pitch detected

    // Parabolic interpolation for finer pitch
    const betterTau = minTau + (yinBuffer[minTau - 1] - yinBuffer[minTau + 1]) / (2 * (yinBuffer[minTau - 1] + yinBuffer[minTau + 1] - 2 * yinBuffer[minTau]));
    return sampleRate / betterTau;
  }

  private getDefaultMetrics(): BodyLanguageMetrics {
    return {
      face: {
        eyeContact: 0,
        emotion: 'neutral',
        emotionConfidence: 0,
        facialMovement: 0,
        gazeDirection: { x: 0, y: 0 },
        landmarks: [],
      },
      posture: {
        postureScore: 0,
        shoulderAlignment: 0,
        headPosition: 0,
        stability: 0,
        landmarks: [],
      },
      gestures: {
        gestureCount: 0,
        gestureVariety: 0,
        handVisibility: 0,
        movementPatterns: [],
      },
      audio: {
        pitch: 0,
        volume: 0,
        speechRate: 0,
        voiceStability: 0,
        audioEmotion: 'silent',
        audioConfidence: 0,
      },
      overallConfidence: 0,
      timestamp: Date.now(),
    };
  }

  cleanup() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    if (this.gestureRecognizer) {
      this.gestureRecognizer.close();
      this.gestureRecognizer = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.previousFaceLandmarks = null;
    this.previousPoseLandmarks = null;
    this.gestureHistory = [];
    this.emotionHistory = [];
    this.pitchHistory = [];
  }
}
