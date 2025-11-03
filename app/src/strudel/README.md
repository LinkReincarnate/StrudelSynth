# Strudel Integration for StrudelSynth

This directory contains the Strudel pattern engine integration.

## How Strudel is Loaded

Strudel is loaded via CDN in the HTML file (not via npm):

```html
<!-- index.html -->
<script src="https://unpkg.com/@strudel/web@1.2.6"></script>
```

This makes global functions available: `initStrudel`, `note`, `s`, `sound`, `n`, `hush`, `samples`

## Initialization (CRITICAL)

**You MUST initialize Strudel with the `prebake` option** to load samples:

```typescript
await initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
});
```

Without this, patterns will only produce clicking sounds (scheduler ticking with no audio).

## Pattern Control API

### Creating and Playing Patterns

```typescript
// Create a pattern and play it
const pattern = s('bd').play();  // Returns Pattern object

// Pattern methods are chainable
const melody = note('c4 e4 g4')
  .s('arpy')
  .fast(2)
  .lpf(800)
  .play();
```

### Stopping Patterns

**IMPORTANT**: Use `.hush()` NOT `.stop()`

```typescript
// Stop a specific pattern
pattern.hush();

// Stop ALL patterns globally
hush();
```

## Working Sound Palette

### Built-in Synths (always available)
- `sine` - Smooth sine wave
- `sawtooth` - Buzzy synth (good for bass)
- `square` - Hollow synth
- `triangle` - Soft synth

Usage:
```typescript
note('c3 g3').s('sawtooth').play()
sound('sine').note('c4').play()
```

### Drum Samples (from dirt-samples)
- `bd` - Kick drum
- `sd` - Snare
- `hh` - Hi-hat
- `cp` - Clap
- `oh` - Open hi-hat
- `perc`, `rim`, `tabla`, etc.

Usage:
```typescript
s('bd').play()
s('bd sd, hh*8').play()  // Layered drums
```

### Melodic Samples (from dirt-samples)
- `arpy` - Arpeggio synth
- `bass` - Bass samples
- `casio` - Casio keyboard
- `gtr` - Guitar samples

Usage:
```typescript
note('c4 e4 g4').s('arpy').play()
n('0 2 4').s('bass').play()  // Note indices
```

### ❌ NOT Available
- `piano` - Does not exist in dirt-samples
- `superpiano` - Does not exist
- `flbass` - Does not exist

## Pattern Modifiers

```typescript
// Speed control
.fast(2)    // Double speed
.slow(2)    // Half speed

// Filters
.lpf(800)   // Low-pass filter at 800Hz
.hpf(200)   // High-pass filter at 200Hz

// Effects
.rev()      // Reverse pattern
.gain(0.5)  // Volume (0.0 - 1.0+)

// Stereo
.jux(rev)   // Apply function to right channel (stereo effect)
```

## Example Integration

```typescript
// src/strudel/StrudelEngine.ts (to be implemented in Phase 1.3)

import { Pattern } from '../lib/types';

export class StrudelEngine {
  private initialized = false;
  private activePatterns = new Map<number, Pattern>();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await initStrudel({
      prebake: () => samples('github:tidalcycles/dirt-samples'),
    });

    this.initialized = true;
  }

  evaluatePattern(code: string): Pattern {
    // Evaluate Strudel code string
    const fn = new Function(`
      with (window) {
        return ${code};
      }
    `);
    return fn();
  }

  startPattern(slotIndex: number, code: string): void {
    // Stop existing pattern in slot
    this.stopPattern(slotIndex);

    // Evaluate and play new pattern
    const pattern = this.evaluatePattern(code).play();
    this.activePatterns.set(slotIndex, pattern);
  }

  stopPattern(slotIndex: number): void {
    const pattern = this.activePatterns.get(slotIndex);
    if (pattern) {
      pattern.hush();
      this.activePatterns.delete(slotIndex);
    }
  }

  stopAll(): void {
    // Option 1: Use global hush
    hush();
    this.activePatterns.clear();

    // Option 2: Stop each pattern individually
    // for (const [_, pattern] of this.activePatterns) {
    //   pattern.hush();
    // }
    // this.activePatterns.clear();
  }
}
```

## Testing

See test files in `public/`:
- `strudel-test-v5.html` - Working sample integration
- `strudel-test-v6.html` - Sound palette discovery

## Resources

- **Official Docs**: https://strudel.cc/technical-manual/
- **REPL**: https://strudel.cc/
- **CDN**: https://unpkg.com/@strudel/web@1.2.6
- **Research**: `specs/research/strudel-api.md`
