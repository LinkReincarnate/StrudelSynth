# API Contract: Visualizer

**Module**: `src/visualizer/LEDVisualizer.ts`
**Date**: 2025-11-02

Audio-reactive LED visualizations for APCKEY25 button grid.

## LEDVisualizer

```typescript
export class LEDVisualizer {
  /**
   * Initialize visualizer
   * @param midiController - MIDI controller for LED output
   * @param audioAnalyzer - Audio analysis source
   */
  constructor(
    midiController: MIDIControllerManager,
    audioAnalyzer: AudioAnalyzer
  )

  /**
   * Set visualization mode
   */
  setMode(mode: VisualizerMode): void

  /**
   * Get current mode
   */
  getMode(): VisualizerMode

  /**
   * Enable/disable visualization
   */
  setEnabled(enabled: boolean): void

  /**
   * Update color scheme
   */
  setColorScheme(scheme: ColorScheme): void

  /**
   * Set audio sensitivity (0-1)
   */
  setSensitivity(value: number): void

  /**
   * Set LED update rate (15-60 FPS)
   */
  setUpdateRate(fps: number): void

  /**
   * Start visualization loop
   */
  start(): void

  /**
   * Stop visualization loop
   */
  stop(): void

  /**
   * Manually update LEDs (single frame)
   */
  update(): void
}
```

## Types

```typescript
export type VisualizerMode =
  | 'pattern'    // Pattern state display (default)
  | 'vuMeter'    // Volume meter (RMS)
  | 'beatPulse'  // Beat detection pulses
  | 'spectrum'   // Frequency spectrum

export interface ColorScheme {
  primary: RGBColor       // Main color
  secondary: RGBColor     // Accent color
  background: RGBColor    // Background/off state
  gradient: boolean       // Interpolate between colors
}

export interface RGBColor {
  r: number  // 0-127
  g: number  // 0-127
  b: number  // 0-127
}

export interface AudioAnalyzer {
  /**
   * Get RMS (root mean square) volume
   * @returns Volume level (0-1)
   */
  getRMS(): number

  /**
   * Get FFT frequency data
   * @returns Array of magnitudes per frequency bin
   */
  getFFT(): Float32Array

  /**
   * Check if beat detected
   * @returns true if onset detected in current frame
   */
  isBeat(): boolean

  /**
   * Get peak frequency magnitude
   */
  getPeak(): number
}
```

## Visualization Modes

### 1. Pattern Mode (Default)

Shows pattern states on button grid:

```typescript
// Empty slot → Off (0,0,0)
// Loaded → Amber (127,64,0)
// Playing → Green (0,127,0)
// Recording → Red (127,0,0) blink
```

### 2. VU Meter Mode

Columns show audio volume:

```typescript
// Each column = audio level
// Rows light bottom-to-top based on RMS
// Color gradient: green (low) → yellow (mid) → red (peak)

const rms = audioAnalyzer.getRMS() // 0-1
const rowsToLight = Math.floor(rms * 5) // 0-5 rows

for (let col = 0; col < 8; col++) {
  for (let row = 0; row < rowsToLight; row++) {
    const slotIndex = row * 8 + col
    const color = interpolateColor(
      GREEN,
      RED,
      row / 5  // Bottom = green, top = red
    )
    setLED(slotIndex, color, 'solid')
  }
}
```

### 3. Beat Pulse Mode

Flashes on beat detection:

```typescript
if (audioAnalyzer.isBeat()) {
  // Flash all LEDs
  for (let i = 0; i < 40; i++) {
    setLED(i, colorScheme.primary, 'pulse')
  }
}
```

### 4. Spectrum Mode

FFT frequency analysis:

```typescript
const fftData = audioAnalyzer.getFFT() // 512-2048 bins
const binsPerColumn = Math.floor(fftData.length / 8)

for (let col = 0; col < 8; col++) {
  // Average FFT bins for this column
  const binStart = col * binsPerColumn
  const binEnd = binStart + binsPerColumn
  const magnitude = average(fftData.slice(binStart, binEnd))

  // Light rows bottom-to-top based on magnitude
  const rowsToLight = Math.floor(magnitude * 5)
  for (let row = 0; row < rowsToLight; row++) {
    const slotIndex = row * 8 + col
    setLED(slotIndex, colorScheme.primary, 'solid')
  }
}
```

## Usage Example

```typescript
import { LEDVisualizer } from './visualizer/LEDVisualizer'
import { AudioAnalyzer } from './audio/AudioAnalyzer'
import { MIDIControllerManager } from './midi/MIDIControllerManager'

// Setup
const midiController = new MIDIControllerManager()
await midiController.initialize()
await midiController.connect(deviceId)

const audioContext = new AudioContext()
const audioAnalyzer = new AudioAnalyzer(audioContext)

const visualizer = new LEDVisualizer(midiController, audioAnalyzer)

// Configure
visualizer.setMode('vuMeter')
visualizer.setColorScheme({
  primary: { r: 0, g: 127, b: 127 },    // Cyan
  secondary: { r: 127, g: 0, b: 127 },   // Magenta
  background: { r: 0, g: 0, b: 0 },      // Off
  gradient: true
})
visualizer.setSensitivity(0.7)
visualizer.setUpdateRate(30) // 30 FPS

// Start
visualizer.setEnabled(true)
visualizer.start()

// Switch modes
setTimeout(() => {
  visualizer.setMode('beatPulse')
}, 30000) // After 30 seconds

// Stop
// visualizer.stop()
```

## Integration with Strudel

Extends Strudel's `@strudel/draw` visualizer:

```typescript
import { getDrawContext } from '@strudel/draw'

// Register custom visualizer
getDrawContext().on('draw', ({ haps, time, ctx }) => {
  // haps = scheduled events (notes, samples)
  // Map haps to LED grid
  haps.forEach(hap => {
    const slotIndex = hap.context.pattern?.slotIndex
    if (slotIndex !== undefined) {
      const color = getColorForEvent(hap)
      visualizer.setLED(slotIndex, color, 'pulse')
    }
  })
})
```

## Performance

- **Update Rate**: 30+ FPS (per constitution)
- **Latency**: <33ms LED updates
- **CPU Usage**: <5% (efficient batch updates)

---

**Status**: Complete
**All contracts complete**
