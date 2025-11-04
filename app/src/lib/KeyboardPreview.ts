/**
 * KeyboardPreview - Plays keyboard notes through Strudel synths
 *
 * Allows real-time preview of synth sounds when playing the APCKEY25 keyboard
 */

import type { KeyboardNoteEvent } from './types';

// Categorize synths by type
const STRUDEL_INSTRUMENTS = ['casio', 'gtr', 'arpy', 'bass'];
const WEB_AUDIO_SYNTHS = ['sine', 'triangle', 'sawtooth', 'square'];
const WAVETABLE_SYNTHS = ['wt_organ', 'wt_bell', 'wt_strings', 'wt_brass', 'wt_lead', 'wt_pad'];
const SAMPLER_INSTRUMENTS = ['sampler_piano', 'sampler_epiano', 'sampler_guitar', 'sampler_bass', 'custom_sample'];

export class KeyboardPreview {
  private initialized = false;
  private currentSynth: string = 'sampler_piano'; // Default to sampler piano
  private audioContext: AudioContext | null = null;
  private wavetables = new Map<string, PeriodicWave>(); // Cache for wavetables
  private samples = new Map<string, AudioBuffer>(); // Cache for audio samples
  private samplesLoading = false;
  private customSampleBaseNote: number = 60; // Base note for custom sample (default C4)

  /**
   * Initialize keyboard preview
   * Must be called after Strudel is initialized
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Get or create audio context
      this.audioContext = new AudioContext();

      // Create wavetables
      this.createWavetables();

      // Create synthetic samples
      await this.createSamples();

      this.initialized = true;
      console.log('✅ KeyboardPreview initialized with wavetables and samples');
    } catch (error) {
      throw new Error(`Failed to initialize KeyboardPreview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create wavetable periodic waves using additive synthesis
   */
  private createWavetables(): void {
    if (!this.audioContext) return;

    // Organ: Strong fundamental + odd harmonics (like drawbar organ)
    this.wavetables.set('wt_organ', this.createPeriodicWave([
      0, 1, 0, 0.3, 0, 0.2, 0, 0.15, 0, 0.1, 0, 0.08, 0, 0.05, 0, 0.03
    ]));

    // Bell: Inharmonic partials (like metallic bells)
    this.wavetables.set('wt_bell', this.createPeriodicWave([
      0, 1, 0.6, 0.4, 0.25, 0.15, 0.1, 0.05, 0.02, 0.01, 0, 0, 0, 0, 0, 0.08
    ]));

    // Strings: Rich even/odd harmonics (like ensemble strings)
    this.wavetables.set('wt_strings', this.createPeriodicWave([
      0, 1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04
    ]));

    // Brass: Strong low harmonics (like trumpet/trombone)
    this.wavetables.set('wt_brass', this.createPeriodicWave([
      0, 1, 0.9, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1, 0.05, 0.02, 0.01
    ]));

    // Lead: Bright with emphasis on higher harmonics (for melodies)
    this.wavetables.set('wt_lead', this.createPeriodicWave([
      0, 0.8, 0.6, 0.9, 0.5, 0.7, 0.4, 0.6, 0.3, 0.5, 0.2, 0.4, 0.15, 0.3
    ]));

    // Pad: Smooth, many harmonics (for ambient/pads)
    this.wavetables.set('wt_pad', this.createPeriodicWave([
      0, 1, 0.7, 0.5, 0.4, 0.35, 0.3, 0.27, 0.24, 0.21, 0.18, 0.16, 0.14, 0.12, 0.11, 0.1,
      0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01
    ]));

    console.log('✅ Created 6 wavetables');
  }

  /**
   * Create a PeriodicWave from harmonic amplitudes
   * @param harmonics Array of harmonic amplitudes (index 0 = DC offset, 1 = fundamental, 2 = 2nd harmonic, etc.)
   */
  private createPeriodicWave(harmonics: number[]): PeriodicWave {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // PeriodicWave expects real (cosine) and imaginary (sine) components
    // For harmonic synthesis, we use only real components (cosine)
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics.length); // All zeros

    return this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  /**
   * Create synthetic audio samples for sampler
   */
  private async createSamples(): Promise<void> {
    if (!this.audioContext) return;

    // Create piano sample (C4 = 261.63 Hz)
    this.samples.set('sampler_piano', await this.synthesizePianoSample(261.63));

    // Create electric piano sample
    this.samples.set('sampler_epiano', await this.synthesizeEPianoSample(261.63));

    // Create guitar sample
    this.samples.set('sampler_guitar', await this.synthesizeGuitarSample(261.63));

    // Create bass sample (C2 = 65.41 Hz)
    this.samples.set('sampler_bass', await this.synthesizeBassSample(65.41));

    console.log('✅ Created 4 sampler instruments');
  }

  /**
   * Synthesize a piano-like sample
   */
  private async synthesizePianoSample(frequency: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const duration = 3.0; // 3 seconds
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate piano-like sound with multiple harmonics and decay
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 1.5); // Exponential decay

      // Multiple harmonics with different amplitudes
      let sample = 0;
      sample += Math.sin(2 * Math.PI * frequency * t) * 1.0; // Fundamental
      sample += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.5; // 2nd harmonic
      sample += Math.sin(2 * Math.PI * frequency * 3 * t) * 0.3; // 3rd harmonic
      sample += Math.sin(2 * Math.PI * frequency * 4 * t) * 0.2; // 4th harmonic
      sample += Math.sin(2 * Math.PI * frequency * 5 * t) * 0.1; // 5th harmonic

      data[i] = sample * decay * 0.3;
    }

    return buffer;
  }

  /**
   * Synthesize an electric piano sample
   */
  private async synthesizeEPianoSample(frequency: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const duration = 2.5;
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // E-piano with bell-like inharmonic partials
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 2.0); // Faster decay than acoustic piano

      let sample = 0;
      sample += Math.sin(2 * Math.PI * frequency * t) * 1.0;
      sample += Math.sin(2 * Math.PI * frequency * 2.1 * t) * 0.6; // Slightly inharmonic
      sample += Math.sin(2 * Math.PI * frequency * 3.2 * t) * 0.4;
      sample += Math.sin(2 * Math.PI * frequency * 4.3 * t) * 0.2;

      data[i] = sample * decay * 0.3;
    }

    return buffer;
  }

  /**
   * Synthesize a guitar pluck sample
   */
  private async synthesizeGuitarSample(frequency: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Guitar with bright attack and fast decay
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attack = t < 0.005 ? t / 0.005 : 1.0; // Very fast attack
      const decay = Math.exp(-t * 3.0); // Fast decay

      let sample = 0;
      sample += Math.sin(2 * Math.PI * frequency * t) * 1.0;
      sample += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.7;
      sample += Math.sin(2 * Math.PI * frequency * 3 * t) * 0.5;
      sample += Math.sin(2 * Math.PI * frequency * 4 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * frequency * 5 * t) * 0.2;
      sample += Math.sin(2 * Math.PI * frequency * 6 * t) * 0.1;

      data[i] = sample * attack * decay * 0.25;
    }

    return buffer;
  }

  /**
   * Synthesize a bass sample
   */
  private async synthesizeBassSample(frequency: number): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const duration = 1.5;
    const sampleRate = this.audioContext.sampleRate;
    const length = duration * sampleRate;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Bass with strong fundamental and few harmonics
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 2.5);

      let sample = 0;
      sample += Math.sin(2 * Math.PI * frequency * t) * 1.0; // Strong fundamental
      sample += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
      sample += Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;

      data[i] = sample * decay * 0.4;
    }

    return buffer;
  }

  /**
   * Load a custom audio sample from ArrayBuffer
   * @param arrayBuffer Raw audio file data
   * @param baseNote Base MIDI note number (default 60 = C4)
   */
  async loadCustomSampleFromArrayBuffer(arrayBuffer: ArrayBuffer, baseNote: number = 60): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }

    // Decode audio data using this KeyboardPreview's own AudioContext
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Store the custom sample
    this.samples.set('custom_sample', audioBuffer);
    this.customSampleBaseNote = baseNote;

    console.log(`✅ Custom sample loaded (base note: ${baseNote}, duration: ${audioBuffer.duration.toFixed(2)}s)`);
  }

  /**
   * Set the current synth/sound for preview
   * @param synthCode Strudel synth code (e.g., "sawtooth", "bd", "piano")
   */
  setSynth(synthCode: string): void {
    this.currentSynth = synthCode;
    console.log(`🎹 Keyboard preview synth: ${synthCode}`);
  }

  /**
   * Get the current synth
   * @returns Current synth name
   */
  getCurrentSynth(): string {
    return this.currentSynth;
  }

  /**
   * Play a keyboard note
   * @param event Keyboard note event
   */
  playNote(event: KeyboardNoteEvent): void {
    if (!this.initialized) {
      console.warn('KeyboardPreview not initialized');
      return;
    }

    if (event.isNoteOn) {
      this.noteOn(event.pitch, event.velocity);
    } else {
      this.noteOff(event.pitch);
    }
  }

  /**
   * Handle note on
   */
  private noteOn(pitch: number, velocity: number): void {
    const velocityNorm = velocity / 127;

    if (!this.audioContext) return;

    // Check if it's a sampler instrument
    if (SAMPLER_INSTRUMENTS.includes(this.currentSynth)) {
      this.playSample(pitch, velocityNorm);
    } else {
      // Use oscillator for synths
      const freq = this.midiToFrequency(pitch);
      this.playOscillator(freq, velocityNorm, pitch);
    }
  }

  /**
   * Play a sampled instrument with pitch shifting
   */
  private playSample(pitch: number, velocity: number): void {
    if (!this.audioContext) return;

    const sample = this.samples.get(this.currentSynth);
    if (!sample) {
      console.warn(`Sample not found: ${this.currentSynth}`);
      return;
    }

    const now = this.audioContext.currentTime;
    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    source.buffer = sample;

    // Calculate pitch shift from base note
    // Piano/EPiano/Guitar samples are at C4 (MIDI 60)
    // Bass sample is at C2 (MIDI 36)
    // Custom sample uses customSampleBaseNote
    let baseNote: number;
    if (this.currentSynth === 'custom_sample') {
      baseNote = this.customSampleBaseNote;
    } else if (this.currentSynth === 'sampler_bass') {
      baseNote = 36;
    } else {
      baseNote = 60;
    }

    const semitoneShift = pitch - baseNote;

    // Use detune for pitch shifting (cents = semitones * 100)
    source.detune.value = semitoneShift * 100;

    // Apply velocity
    gain.gain.value = velocity * 0.5;

    // Connect
    source.connect(gain);
    gain.connect(this.audioContext.destination);

    // Play
    source.start(now);

    // Auto cleanup after sample duration
    setTimeout(() => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch (e) {
        // Already disconnected
      }
    }, 4000); // Max 4 seconds
  }

  /**
   * Play using Strudel pattern system
   */
  private playStrudelSound(pitch: number, velocity: number): void {
    try {
      // Stop any existing note at this pitch
      if (this.activeNotes.has(pitch)) {
        const existingPattern = this.activeNotes.get(pitch);
        if (existingPattern && typeof existingPattern.hush === 'function') {
          existingPattern.hush();
        }
        this.activeNotes.delete(pitch);
      }

      // Convert MIDI pitch to note name
      const noteName = this.midiToNoteName(pitch);

      // Create and play pattern using Strudel
      // @ts-ignore - Strudel functions are global
      const pattern = window.note(noteName)
        .s(this.currentSynth)
        .gain(velocity * 0.8)
        .play();

      // Track the pattern so we can stop it on note off
      this.activeNotes.set(pitch, pattern);

      console.log(`🎹 Playing ${this.currentSynth}: ${noteName}`);
    } catch (error) {
      console.error('Failed to play Strudel sound:', error);
    }
  }

  /**
   * Play using Web Audio oscillator with wavetables
   */
  private playOscillator(freq: number, velocity: number, pitch: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Create oscillator and gain
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Map synth/instrument names to oscillator config
    let filterFreq = 2000;
    let filterQ = 1;
    let attackTime = 0.005;
    let releaseTime = 0.2;
    let useFilter = false;
    let useWavetable = false;

    // Configure based on synth type
    if (WAVETABLE_SYNTHS.includes(this.currentSynth)) {
      // Use wavetable
      const wavetable = this.wavetables.get(this.currentSynth);
      if (wavetable) {
        osc.setPeriodicWave(wavetable);
        useWavetable = true;

        // Configure envelope based on wavetable type
        if (this.currentSynth === 'wt_organ') {
          attackTime = 0.01;
          releaseTime = 0.3;
        } else if (this.currentSynth === 'wt_bell') {
          attackTime = 0.001;
          releaseTime = 0.8;
          useFilter = true;
          filterFreq = 3000;
          filterQ = 1;
        } else if (this.currentSynth === 'wt_strings') {
          attackTime = 0.08;
          releaseTime = 0.6;
          useFilter = true;
          filterFreq = 2500;
          filterQ = 2;
        } else if (this.currentSynth === 'wt_brass') {
          attackTime = 0.02;
          releaseTime = 0.4;
          useFilter = true;
          filterFreq = 2000;
          filterQ = 3;
        } else if (this.currentSynth === 'wt_lead') {
          attackTime = 0.005;
          releaseTime = 0.2;
          useFilter = true;
          filterFreq = 4000;
          filterQ = 2;
        } else if (this.currentSynth === 'wt_pad') {
          attackTime = 0.15;
          releaseTime = 1.0;
          useFilter = true;
          filterFreq = 1500;
          filterQ = 1;
        }
      }
    } else if (WEB_AUDIO_SYNTHS.includes(this.currentSynth)) {
      osc.type = this.currentSynth as OscillatorType;
    } else if (this.currentSynth === 'casio') {
      // Casio keyboard approximation - square with filter
      osc.type = 'square';
      useFilter = true;
      filterFreq = 1500;
      filterQ = 3;
      releaseTime = 0.3;
    } else if (this.currentSynth === 'gtr') {
      // Guitar approximation - sawtooth with pluck
      osc.type = 'sawtooth';
      useFilter = true;
      filterFreq = 2000;
      filterQ = 5;
      attackTime = 0.001;
      releaseTime = 0.4;
    } else if (this.currentSynth === 'arpy') {
      // Arpy - bright square
      osc.type = 'square';
      useFilter = true;
      filterFreq = 3000;
      filterQ = 2;
      releaseTime = 0.15;
    } else if (this.currentSynth === 'bass') {
      // Bass - fat sawtooth with low filter
      osc.type = 'sawtooth';
      useFilter = true;
      filterFreq = 400;
      filterQ = 4;
      releaseTime = 0.25;
    }

    osc.frequency.value = freq;

    // Setup filter if needed
    if (useFilter) {
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;
    }

    // Envelope
    const peakGain = velocity * 0.3;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
    gain.gain.setTargetAtTime(0, now + attackTime, releaseTime);

    // Connect nodes
    if (useFilter) {
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.audioContext.destination);

    osc.start(now);
    osc.stop(now + attackTime + (releaseTime * 5)); // Stop after decay

    // Auto cleanup
    setTimeout(() => {
      try {
        osc.disconnect();
        if (useFilter) filter.disconnect();
        gain.disconnect();
      } catch (e) {
        // Already disconnected
      }
    }, (attackTime + releaseTime * 5) * 1000 + 100);
  }


  /**
   * Convert MIDI note number to frequency (Hz)
   */
  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }


  /**
   * Handle note off
   */
  private noteOff(pitch: number): void {
    // Notes decay naturally with Web Audio envelopes
    // No need to explicitly stop them
  }

  /**
   * Convert MIDI note number to note name
   * @param midiNote MIDI note number (0-127)
   * @returns Note name (e.g., "c4", "d#5")
   */
  private midiToNoteName(midiNote: number): string {
    const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  }

  /**
   * Extract synth code from a Strudel pattern code string
   * @param code Strudel code (e.g., 's("bd").fast(2)')
   * @returns Synth name or default
   */
  extractSynthFromCode(code: string): string {
    // Try to extract .s("...")
    const sMatch = code.match(/\.s\(["']([^"']+)["']\)/);
    if (sMatch) {
      return sMatch[1];
    }

    // Try to extract s("...")
    const sMatch2 = code.match(/s\(["']([^"']+)["']\)/);
    if (sMatch2) {
      return sMatch2[1];
    }

    // Try to extract sound("...")
    const soundMatch = code.match(/sound\(["']([^"']+)["']\)/);
    if (soundMatch) {
      return soundMatch[1];
    }

    // Check for note() patterns - use a default synth
    if (code.includes('note(')) {
      // Try to find .s() after note()
      const noteWithSynth = code.match(/note\([^)]+\)\.s\(["']([^"']+)["']\)/);
      if (noteWithSynth) {
        return noteWithSynth[1];
      }
      return 'triangle'; // Default for note patterns
    }

    // Default fallback
    return 'triangle';
  }

  /**
   * Stop all preview notes
   */
  stopAll(): void {
    // Notes decay naturally - nothing to stop
    console.log('🔇 Keyboard preview notes will decay naturally');
  }
}
