# API Contract: Transcription Engine

**Module**: `src/transcription/StrudelCodeGenerator.ts`
**Date**: 2025-11-02

Auto-transcribes MIDI recordings to Strudel code.

## StrudelCodeGenerator

```typescript
export class StrudelCodeGenerator {
  /**
   * Generate Strudel code from MIDI recording
   * @param recording - Captured MIDI note data
   * @param options - Generation options
   * @returns Generated Strudel code and metadata
   */
  generate(
    recording: Recording,
    options?: TranscriptionOptions
  ): TranscriptionResult

  /**
   * Validate generated Strudel code
   * @param code - Generated code string
   * @returns Validation result
   */
  validate(code: string): ValidationResult
}
```

## Types

```typescript
export interface Recording {
  id: string
  notes: MIDINoteEvent[]
  startTime: number
  endTime: number
  duration: number
  tempo: number
  quantizationGrid: QuantizationGrid
  quantized: boolean
}

export interface MIDINoteEvent {
  pitch: number         // 0-127
  velocity: number      // 1-127
  startTime: number     // ms from recording start
  duration: number      // ms
  channel: number
}

export type QuantizationGrid =
  | '1/4'   // Quarter notes
  | '1/8'   // Eighth notes
  | '1/16'  // Sixteenth notes
  | '1/32'  // Thirty-second notes
  | 'triplet'

export interface TranscriptionOptions {
  quantize?: boolean              // Apply quantization (default: true)
  includeVelocity?: boolean       // Include velocity data (default: true)
  simplifyRhythm?: boolean        // Simplify complex rhythms (default: false)
  tempo?: number                  // Override detected tempo
  sound?: string                  // Default sound (e.g., 'piano', 'sawtooth')
}

export interface TranscriptionResult {
  code: string                    // Generated Strudel code
  accuracy: number                // Confidence score (0-1)
  warnings: string[]              // Simplifications/approximations made
  metadata: {
    noteCount: number
    duration: number
    tempo: number
    timeSignature: string
  }
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

## Usage Example

```typescript
import { StrudelCodeGenerator } from './transcription/StrudelCodeGenerator'

const generator = new StrudelCodeGenerator()

// Recording from keyboard
const recording: Recording = {
  id: 'rec-001',
  notes: [
    { pitch: 60, velocity: 100, startTime: 0, duration: 500, channel: 0 },     // C4
    { pitch: 64, velocity: 90, startTime: 500, duration: 500, channel: 0 },    // E4
    { pitch: 67, velocity: 95, startTime: 1000, duration: 500, channel: 0 },   // G4
    { pitch: 72, velocity: 110, startTime: 1500, duration: 1000, channel: 0 }  // C5
  ],
  startTime: Date.now(),
  endTime: Date.now() + 2500,
  duration: 2500,
  tempo: 120,
  quantizationGrid: '1/8',
  quantized: false
}

// Generate Strudel code
const result = generator.generate(recording, {
  quantize: true,
  includeVelocity: true,
  sound: 'piano'
})

console.log(result.code)
// Output: note("c4 e4 g4 c5").velocity("0.79 0.71 0.75 0.87").s("piano")

console.log(`Accuracy: ${(result.accuracy * 100).toFixed(0)}%`)
// Output: Accuracy: 98%

// Validate code
const validation = generator.validate(result.code)
if (validation.valid) {
  console.log('Code is valid Strudel syntax')
}
```

## Generation Rules

### Note Formatting

```typescript
// Simple melody
notes: [C4, E4, G4] → note("c4 e4 g4")

// With rhythm
notes: [C4(0.5s), E4(0.25s), G4(0.25s)] → note("c4 [e4 g4]")

// Rests
notes: [C4, rest(0.5s), E4] → note("c4 ~ e4")

// Chords (simultaneous notes)
notes: [C4+E4+G4] → note("[c4,e4,g4]")
```

### Velocity Mapping

```typescript
// MIDI velocity (0-127) → Strudel gain (0-1)
velocity: 127 → 1.0
velocity: 100 → 0.79
velocity: 64  → 0.50
velocity: 0   → 0.0

// Applied as: .velocity("0.79 0.50 1.0")
```

### Quantization

```typescript
// Before quantization (actual timing):
notes: [C4@0ms, E4@487ms, G4@1013ms]

// After 1/8 quantization (120 BPM):
notes: [C4@0ms, E4@500ms, G4@1000ms]

// Output: note("c4 e4 g4")
```

---

**Status**: Complete
**Next**: See `visualizer-api.md`
