/**
 * RecordingManager - Handles MIDI recording and transcription
 *
 * Responsibilities:
 * - Record keyboard notes with timing
 * - Detect tempo from note timing
 * - Quantize notes to grid
 * - Generate Strudel code from recordings
 */

import type { Recording, RecordedNote, QuantizedNote, KeyboardNoteEvent, RecordingState } from '../lib/types';

export type RecordingStateChangeHandler = (state: RecordingState, recording: Recording | null) => void;

export class RecordingManager {
  private recording: Recording | null = null;
  private activeNotes: Map<number, number> = new Map(); // pitch -> startTime

  // Event handlers
  private stateChangeHandlers: RecordingStateChangeHandler[] = [];

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.recording?.state || 'idle';
  }

  /**
   * Get current recording
   */
  getRecording(): Recording | null {
    return this.recording;
  }

  /**
   * Arm recording for a specific slot
   * Recording will start when first note is played
   */
  armRecording(targetSlot: number, quantizeGrid: number = 16): void {
    if (this.recording && this.recording.state === 'recording') {
      console.warn('Already recording - stop current recording first');
      return;
    }

    this.recording = {
      notes: [],
      startTime: 0, // Will be set when first note arrives
      endTime: 0,
      detectedTempo: null,
      quantizeGrid,
      state: 'armed',
      targetSlot,
    };

    this.activeNotes.clear();
    this.notifyStateChange();

    console.log(`🎙️ Recording armed for slot ${targetSlot} (grid: 1/${quantizeGrid})`);
  }

  /**
   * Stop recording
   */
  stopRecording(): Recording | null {
    if (!this.recording || this.recording.state === 'idle') {
      console.warn('No recording active');
      return null;
    }

    if (this.recording.state === 'armed') {
      // Cancel armed recording
      this.recording = null;
      this.notifyStateChange();
      console.log('🎙️ Recording cancelled (no notes played)');
      return null;
    }

    // Finalize recording
    this.recording.endTime = Date.now();
    this.recording.state = 'stopped';

    // Stop any active notes
    this.activeNotes.clear();

    // Detect tempo
    this.recording.detectedTempo = this.detectTempo(this.recording.notes);

    console.log(`✅ Recording stopped:`, {
      noteCount: this.recording.notes.length,
      duration: this.recording.endTime - this.recording.startTime,
      detectedTempo: this.recording.detectedTempo,
    });

    this.notifyStateChange();
    return this.recording;
  }

  /**
   * Clear/discard current recording
   */
  clearRecording(): void {
    this.recording = null;
    this.activeNotes.clear();
    this.notifyStateChange();
    console.log('🗑️ Recording cleared');
  }

  /**
   * Handle keyboard note event
   */
  handleKeyboardNote(event: KeyboardNoteEvent): void {
    if (!this.recording) return;

    if (event.isNoteOn) {
      this.handleNoteOn(event.pitch, event.velocity, event.timestamp);
    } else {
      this.handleNoteOff(event.pitch, event.timestamp);
    }
  }

  /**
   * Handle note on event
   */
  private handleNoteOn(pitch: number, velocity: number, timestamp: number): void {
    if (!this.recording) return;

    // Start recording on first note if armed
    if (this.recording.state === 'armed') {
      this.recording.state = 'recording';
      this.recording.startTime = timestamp;
      this.notifyStateChange();
      console.log('🎙️ Recording started');
    }

    // Only record if in recording state
    if (this.recording.state !== 'recording') return;

    // Track active note
    this.activeNotes.set(pitch, timestamp);
  }

  /**
   * Handle note off event
   */
  private handleNoteOff(pitch: number, timestamp: number): void {
    if (!this.recording || this.recording.state !== 'recording') return;

    // Find matching note on
    const startTime = this.activeNotes.get(pitch);
    if (startTime === undefined) {
      console.warn(`Note off without matching note on: ${pitch}`);
      return;
    }

    // Calculate duration
    const duration = timestamp - startTime;

    // Add to recording (with timing relative to recording start)
    const note: RecordedNote = {
      pitch,
      velocity: 100, // We don't get velocity from note off, use default
      startTime: startTime - this.recording.startTime,
      duration,
    };

    this.recording.notes.push(note);
    this.activeNotes.delete(pitch);

    console.log(`📝 Note recorded: ${this.midiToNoteName(pitch)} (${duration.toFixed(0)}ms)`);
  }

  /**
   * Detect tempo from note timing
   * Uses inter-onset intervals (IOIs) between notes
   */
  private detectTempo(notes: RecordedNote[]): number | null {
    if (notes.length < 4) {
      console.warn('Need at least 4 notes to detect tempo');
      return null;
    }

    // Calculate inter-onset intervals
    const iois: number[] = [];
    for (let i = 1; i < notes.length; i++) {
      iois.push(notes[i].startTime - notes[i - 1].startTime);
    }

    // Find most common interval (simple approach: average)
    const avgIOI = iois.reduce((a, b) => a + b, 0) / iois.length;

    // Convert to BPM (assuming 1/4 notes)
    // BPM = 60000 / (avgIOI * 4) for 1/16 notes
    // BPM = 60000 / avgIOI for 1/4 notes
    const bpm = 60000 / avgIOI;

    // Round to nearest common tempo
    const commonTempos = [60, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
    const closest = commonTempos.reduce((prev, curr) =>
      Math.abs(curr - bpm) < Math.abs(prev - bpm) ? curr : prev
    );

    console.log(`🎵 Tempo detected: ${closest} BPM (raw: ${bpm.toFixed(1)})`);
    return closest;
  }

  /**
   * Quantize notes to grid
   */
  quantizeRecording(recording: Recording): QuantizedNote[] {
    const tempo = recording.detectedTempo || 120; // Default to 120 BPM
    const grid = recording.quantizeGrid;

    // Calculate step size in milliseconds
    // For 120 BPM, 1/4 note = 500ms
    // 1/16 note = 125ms
    const quarterNoteMs = (60 / tempo) * 1000;
    const stepMs = quarterNoteMs / (grid / 4);

    console.log(`⚙️ Quantizing to 1/${grid} grid (step = ${stepMs.toFixed(1)}ms)`);

    const quantized: QuantizedNote[] = recording.notes.map(note => {
      // Round to nearest step
      const step = Math.round(note.startTime / stepMs);
      const durationSteps = Math.max(1, Math.round(note.duration / stepMs));

      return {
        pitch: note.pitch,
        velocity: note.velocity,
        step,
        durationSteps,
      };
    });

    return quantized;
  }

  /**
   * Generate Strudel code from recording
   */
  generateStrudelCode(recording: Recording): string {
    if (recording.notes.length === 0) {
      return 's("silence")';
    }

    // Quantize first
    const quantized = this.quantizeRecording(recording);

    // Sort by step
    quantized.sort((a, b) => a.step - b.step);

    // Build note pattern
    const noteNames = quantized.map(n => this.midiToNoteName(n.pitch).toLowerCase());

    // Simple approach: just list the notes
    // TODO: Add rhythm support with rests and subdivisions
    const notePattern = noteNames.join(' ');

    // Generate code
    let code = `note("${notePattern}").s("sine")`;

    // Add velocity if there's variation
    const velocities = quantized.map(n => (n.velocity / 127).toFixed(2));
    const hasVelocityVariation = new Set(velocities).size > 1;

    if (hasVelocityVariation) {
      code += `.velocity("${velocities.join(' ')}")`;
    }

    console.log(`📝 Generated code: ${code}`);
    return code;
  }

  /**
   * Convert MIDI note number to note name
   */
  private midiToNoteName(pitch: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Register state change handler
   */
  onStateChange(handler: RecordingStateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    return () => {
      const index = this.stateChangeHandlers.indexOf(handler);
      if (index > -1) this.stateChangeHandlers.splice(index, 1);
    };
  }

  /**
   * Notify state change handlers
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(state, this.recording);
      } catch (error) {
        console.error('State change handler error:', error);
      }
    });
  }
}
