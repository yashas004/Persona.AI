// ------------------------------------------------------------
//  Advanced audio analysis – Web Audio API (browser only)
//  Fixed Clarity calculation + copy-paste safe
// ------------------------------------------------------------
export interface AudioFeatures {
  pitch: number;               // Hz (YIN)
  pitchVariation: number;      // 0-100
  volume: number;              // dB
  volumeVariation: number;     // 0-100
  pace: number;                // Words per minute (external)
  clarity: number;             // 0-100 (fixed)
  energy: number;              // 0-100
  spectralCentroid: number;    // Hz
  zeroCrossingRate: number;    // crossings/sample
  snr: number;                 // dB
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private frequencyData: Uint8Array | null = null;

  private pitchHistory: number[] = [];
  private volumeHistory: number[] = [];
  private energyHistory: number[] = [];

  private noiseFloor = -60;
  private noiseCalibrated = false;
  private calibrationSamples: number[] = [];

  private readonly VOICE_THRESHOLD_DB = -45;   // dB
  private readonly MIN_PITCH = 80;            // Hz
  private readonly MAX_PITCH = 500;           // Hz
  private readonly HISTORY_SIZE = 50;

  // --------------------------------------------------------
  //  INITIALIZE
  // --------------------------------------------------------
  initialize(stream: MediaStream): void {
    try {
      this.audioContext = new AudioContext({
        sampleRate: 48000,
        latencyHint: 'interactive',
      });

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.frequencyData = new Uint8Array(bufferLength);

      // reset calibration
      this.noiseCalibrated = false;
      this.calibrationSamples = [];
    } catch (e) {
      console.error('AudioAnalyzer init error:', e);
      throw new Error('Microphone permission or Web Audio not supported.');
    }
  }

  // --------------------------------------------------------
  //  MAIN FEATURE EXTRACTION
  // --------------------------------------------------------
  getAudioFeatures(): AudioFeatures {
    if (!this.analyser || !this.dataArray || !this.frequencyData) {
      return this.defaultFeatures();
    }

    try {
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.analyser.getByteFrequencyData(this.frequencyData);

      const rms = this.calculateRMS(this.dataArray);
      const volumeDB = this.convertToDecibels(rms);

      // ---- noise floor calibration (first ~20 frames) ----
      if (!this.noiseCalibrated) this.calibrateNoiseFloor(volumeDB);

      const snr = this.calculateSNR(volumeDB);
      const isVoice = volumeDB > this.VOICE_THRESHOLD_DB && snr > 0;

      if (!isVoice) return this.defaultFeatures();

      // ---- Pitch (YIN) ----
      const pitch = this.detectPitchYIN(this.dataArray);
      const validPitch = this.isValidPitch(pitch) ? pitch : 0;
      if (validPitch) {
        this.pitchHistory.push(validPitch);
        if (this.pitchHistory.length > this.HISTORY_SIZE) this.pitchHistory.shift();
      }

      // ---- Volume history ----
      this.volumeHistory.push(volumeDB);
      if (this.volumeHistory.length > this.HISTORY_SIZE) this.volumeHistory.shift();

      // ---- Energy ----
      const energy = this.calculateEnergy(this.frequencyData);
      this.energyHistory.push(energy);
      if (this.energyHistory.length > this.HISTORY_SIZE) this.energyHistory.shift();

      // ---- Other spectral features ----
      const spectralCentroid = this.calculateSpectralCentroid(this.frequencyData);
      const zcr = this.calculateZeroCrossingRate(this.dataArray);

      // ---- Variations ----
      const pitchVariation = this.calculateVariation(this.pitchHistory);
      const volumeVariation = this.calculateVariation(this.volumeHistory);

      // ---- CLARITY (fixed) ----
      const clarity = this.calculateClarity(snr, zcr, spectralCentroid, energy);

      return {
        pitch: Math.round(validPitch),
        pitchVariation: Math.round(Math.min(100, pitchVariation * 100)),
        volume: Math.round(volumeDB * 10) / 10,
        volumeVariation: Math.round(Math.min(100, volumeVariation * 100)),
        pace: 0, // filled externally
        clarity: Math.round(clarity),
        energy: Math.round(energy),
        spectralCentroid: Math.round(spectralCentroid),
        zeroCrossingRate: Number(zcr.toFixed(3)),
        snr: Math.round(snr * 10) / 10,
      };
    } catch (e) {
      console.error('Feature extraction error:', e);
      return this.defaultFeatures();
    }
  }

  // --------------------------------------------------------
  //  YIN PITCH DETECTION (accurate for speech)
  // --------------------------------------------------------
  private detectPitchYIN(buffer: Uint8Array): number {
    const SIZE = buffer.length;
    const sampleRate = this.audioContext?.sampleRate ?? 48000;

    const minPeriod = Math.floor(sampleRate / this.MAX_PITCH);
    const maxPeriod = Math.floor(sampleRate / this.MIN_PITCH);
    const searchSize = Math.min(maxPeriod, Math.floor(SIZE / 2));
    if (searchSize < minPeriod) return 0;

    const threshold = 0.15;

    // ---- difference function ----
    const difference = new Float32Array(searchSize);
    for (let tau = 0; tau < searchSize; tau++) {
      let sum = 0;
      for (let i = 0; i < searchSize; i++) {
        const a = (buffer[i] - 128) / 128;
        const b = (buffer[i + tau] - 128) / 128;
        const delta = a - b;
        sum += delta * delta;
      }
      difference[tau] = sum;
    }

    // ---- cumulative mean normalized difference ----
    const cmndf = new Float32Array(searchSize);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < searchSize; tau++) {
      runningSum += difference[tau];
      cmndf[tau] = difference[tau] / (runningSum / tau);
    }

    // ---- absolute threshold + parabolic interpolation ----
    let tau = minPeriod;
    while (tau < searchSize) {
      if (cmndf[tau] < threshold) {
        while (tau + 1 < searchSize && cmndf[tau + 1] < cmndf[tau]) tau++;
        if (tau > 0 && tau < searchSize - 1) {
          const y0 = cmndf[tau - 1];
          const y1 = cmndf[tau];
          const y2 = cmndf[tau + 1];
          const betterTau = tau + (y2 - y0) / (2 * (2 * y1 - y0 - y2));
          return sampleRate / betterTau;
        }
        return sampleRate / tau;
      }
      tau++;
    }
    return 0;
  }

  // --------------------------------------------------------
  //  SNR
  // --------------------------------------------------------
  private calculateSNR(signalDB: number): number {
    if (!this.noiseCalibrated) return 0;
    return Math.max(0, signalDB - this.noiseFloor);
  }

  // --------------------------------------------------------
  //  RMS → dB
  // --------------------------------------------------------
  private calculateRMS(buffer: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const norm = (buffer[i] - 128) / 128;
      sum += norm * norm;
    }
    return Math.sqrt(sum / buffer.length);
  }

  private convertToDecibels(rms: number): number {
    return rms === 0 ? -Infinity : 20 * Math.log10(rms);
  }

  // --------------------------------------------------------
  //  ENERGY (0-100)
  // --------------------------------------------------------
  private calculateEnergy(freqData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < freqData.length; i++) {
      const norm = freqData[i] / 255;
      sum += norm * norm;
    }
    return Math.sqrt(sum / freqData.length) * 100;
  }

  // --------------------------------------------------------
  //  SPECTRAL CENTROID
  // --------------------------------------------------------
  private calculateSpectralCentroid(freqData: Uint8Array): number {
    let weighted = 0;
    let total = 0;
    for (let i = 0; i < freqData.length; i++) {
      const val = freqData[i];
      weighted += i * val;
      total += val;
    }
    return total === 0 ? 0 : weighted / total;
  }

  // --------------------------------------------------------
  //  ZERO CROSSING RATE
  // --------------------------------------------------------
  private calculateZeroCrossingRate(buffer: Uint8Array): number {
    let crosses = 0;
    for (let i = 1; i < buffer.length; i++) {
      const a = buffer[i - 1] >= 128;
      const b = buffer[i] >= 128;
      if (a !== b) crosses++;
    }
    return crosses / buffer.length;
  }

  // --------------------------------------------------------
  //  VARIATION (coeff of variation)
  // --------------------------------------------------------
  private calculateVariation(history: number[]): number {
    if (history.length < 2) return 0;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    if (mean === 0) return 0;
    const variance =
      history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length;
    return Math.sqrt(variance) / Math.abs(mean);
  }

  // --------------------------------------------------------
  //  CLARITY – FIXED & ROBUST
  // --------------------------------------------------------
  private calculateClarity(
    snr: number,
    zcr: number,
    centroid: number,
    energy: number
  ): number {
    // 1. SNR (60%) – good speech ≈ 10-30 dB
    const snrScore = Math.max(0, Math.min(100, ((snr + 10) / 40) * 100));

    // 2. ZCR (20%) – lower is clearer (speech < 0.3)
    const zcrScore = Math.max(0, (1 - Math.min(zcr / 0.3, 1)) * 100);

    // 3. Spectral Centroid (10%) – speech around 100-200 bins
    const centroidScore = Math.max(0, Math.min(100, (centroid / 250) * 100));

    // 4. Energy (10%) – already 0-100
    const energyScore = Math.max(0, Math.min(100, energy));

    return (
      snrScore * 0.6 +
      zcrScore * 0.2 +
      centroidScore * 0.1 +
      energyScore * 0.1
    );
  }

  // --------------------------------------------------------
  //  NOISE FLOOR CALIBRATION (median of first 20 quiet frames)
  // --------------------------------------------------------
  private calibrateNoiseFloor(volumeDB: number): void {
    this.calibrationSamples.push(volumeDB);
    if (this.calibrationSamples.length >= 20) {
      const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
      this.noiseFloor = sorted[Math.floor(sorted.length / 2)];
      this.noiseCalibrated = true;
    }
  }

  // --------------------------------------------------------
  //  HELPERS
  // --------------------------------------------------------
  private isValidPitch(p: number): boolean {
    return p >= this.MIN_PITCH && p <= this.MAX_PITCH;
  }

  private defaultFeatures(): AudioFeatures {
    return {
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
  }

  // --------------------------------------------------------
  //  CLEANUP
  // --------------------------------------------------------
  cleanup(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.frequencyData = null;
    this.pitchHistory = [];
    this.volumeHistory = [];
    this.energyHistory = [];
    this.calibrationSamples = [];
    this.noiseCalibrated = false;
    this.noiseFloor = -60;
  }
}
