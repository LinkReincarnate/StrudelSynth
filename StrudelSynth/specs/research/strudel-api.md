# Strudel API Research (RT-1)

**Date**: 2025-11-02
**Status**: ✅ Complete
**Critical Finding**: npm packages have dependency typo bug

---

## Executive Summary

**Recommended Approach**: Use **CDN version** of `@strudel/web` via script tag, NOT npm packages.

**Why**: Strudel npm packages have a dependency typo bug (`supradough` vs `superdough`) that prevents installation. The CDN approach is recommended in official docs anyway and works reliably.

---

## Problem Discovered

### npm Installation Fails

**Error**:
```
npm error 404  The requested resource 'supradough@1.2.4' could not be found
```

**Root Cause**: Strudel packages (`@strudel/webaudio`, `@strudel/web`, etc.) have a **typo** in their dependencies:
- They look for: `supradough` (with 'a')
- Correct package: `superdough` (with 'o')

**Affected Packages**:
- `@strudel/webaudio` ❌
- `@strudel/web` ❌
- `@strudel/soundfonts` ❌
- `@strudel/core` ✅ (works standalone)

---

## Solution: CDN Integration

### Recommended Approach

Use `@strudel/web` from unpkg.com CDN. This is the **official recommended method** per Strudel docs.

### Implementation

**HTML Approach** (for testing):
```html
<script src="https://unpkg.com/@strudel/web@1.2.6"></script>
<script>
  initStrudel();

  // Play a pattern
  note('c a f e').s('piano').play();
</script>
```

**Vite/Svelte Approach** (for our project):

1. **Load via public/index.html**:
```html
<!-- public/index.html -->
<script src="https://unpkg.com/@strudel/web@1.2.6"></script>
```

2. **Or use Vite plugin to inject script**:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    {
      name: 'inject-strudel',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          '<script src="https://unpkg.com/@strudel/web@1.2.6"></script></head>'
        );
      }
    }
  ]
});
```

3. **TypeScript declarations** (since loaded globally):
```typescript
// src/lib/strudel.d.ts
declare function initStrudel(): Promise<void>;

declare function note(pattern: string): Pattern;
declare function s(sample: string): Pattern;
declare function sound(sample: string): Pattern;

interface Pattern {
  s(sample: string): Pattern;
  sound(sample: string): Pattern;
  n(notes: string): Pattern;
  note(notes: string): Pattern;
  scale(scale: string): Pattern;
  fast(speed: number): Pattern;
  slow(speed: number): Pattern;
  rev(): Pattern;
  jux(fn: (p: Pattern) => Pattern): Pattern;
  play(): void;
  stop(): void;
  // Add more as needed
}
```

---

## How Strudel Works

### Initialization

```typescript
// Must be called before using Strudel
await initStrudel();
```

This initializes the Web Audio context and loads necessary resources.

###

 Pattern Evaluation

**Mini Notation** (Strudel's DSL):
```javascript
// Simple pattern
note('c4 e4 g4').s('piano').play();

// Complex pattern
note('<c a f e>*4')
  .scale('C minor')
  .s('sawtooth')
  .fast(2)
  .jux(rev)
  .play();
```

**Functions Available**:
- `note(pattern)` - Musical notes
- `s(sample)` - Sample/sound name
- `sound(sample)` - Alias for s()
- `n(notes)` - Note numbers
- Pattern modifiers: `.fast()`, `.slow()`, `.rev()`, `.jux()`, etc.

### Starting/Stopping Patterns

```javascript
// Start playing
const pattern = note('c e g').s('piano');
pattern.play();

// Stop playing
pattern.stop();
```

### Multiple Patterns (Layering)

```javascript
// Each pattern runs independently
const drums = s('bd sd').play();
const bass = note('c2').s('sawtooth').play();

// Stop individual patterns
drums.stop();
bass.stop();
```

---

## Integration with StrudelSynth

### Phase 1 Approach

1. **Load Strudel via CDN** in `index.html` or Vite config
2. **Initialize on app start** (after audio init overlay click)
3. **Wrap in TypeScript-safe functions**:

```typescript
// src/strudel/StrudelEngine.ts

export class StrudelEngine {
  private initialized = false;
  private activePatterns = new Map<number, any>();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // @ts-ignore - loaded from CDN
    await initStrudel();
    this.initialized = true;
  }

  evaluatePattern(code: string): any {
    // Use eval or Function constructor
    // Strudel code is JavaScript expressions
    const fn = new Function(`
      with (window) {
        return ${code};
      }
    `);

    return fn();
  }

  startPattern(slotIndex: number, pattern: any): void {
    // Stop existing pattern in this slot
    this.stopPattern(slotIndex);

    // Start new pattern
    pattern.play();
    this.activePatterns.set(slotIndex, pattern);
  }

  stopPattern(slotIndex: number): void {
    const pattern = this.activePatterns.get(slotIndex);
    if (pattern) {
      pattern.stop();
      this.activePatterns.delete(slotIndex);
    }
  }

  stopAll(): void {
    for (const [_, pattern] of this.activePatterns) {
      pattern.stop();
    }
    this.activePatterns.clear();
  }
}
```

### Example Usage

```typescript
const strudelEngine = new StrudelEngine();
await strudelEngine.initialize();

// Evaluate pattern from code string
const pattern = strudelEngine.evaluatePattern('note("c e g").s("piano")');

// Play it
strudelEngine.startPattern(0, pattern);  // slot 0

// Stop it
strudelEngine.stopPattern(0);
```

---

## Pattern Examples for Default Library

### 1. Kick Drum
```javascript
s('bd').fast(2)
```

### 2. Snare
```javascript
s('sd').fast(2)
```

### 3. Hi-Hat
```javascript
s('hh*8')
```

### 4. Bass Line
```javascript
note('c2 c2 eb2 g2').s('sawtooth').lpf(800)
```

### 5. Chord Progression
```javascript
note('<c3 e3 g3 c4>').s('piano')
```

### 6. Arpeggio
```javascript
note('c4 e4 g4 b4 c5').fast(4).s('triangle')
```

### 7. Melody
```javascript
note('c4 d4 e4 g4 a4 g4 e4 d4').slow(2).s('sine')
```

### 8. Percussion
```javascript
s('cp, rim*4, ~ clap')
```

---

## Parameter Control (Real-time)

### Approach

Strudel patterns are immutable. To change parameters:

1. **Recreate pattern** with new values
2. **Or use Strudel's built-in controls** (if available)

**Example**:

```typescript
// Knob controls speed
function updateSpeed(slotIndex: number, speed: number) {
  const baseCode = patternSlots[slotIndex].baseCode;  // Store original

  // Modify code with new speed
  const newCode = `${baseCode}.fast(${speed})`;

  // Re-evaluate and restart
  const newPattern = strudelEngine.evaluatePattern(newCode);
  strudelEngine.startPattern(slotIndex, newPattern);
}
```

**Better Approach** (Store base pattern):

```typescript
class PatternSlot {
  baseCode: string;           // Original code
  modifiers: {                // Active modifiers
    speed?: number;
    filter?: number;
  };

  getFullCode(): string {
    let code = this.baseCode;

    if (this.modifiers.speed) {
      code += `.fast(${this.modifiers.speed})`;
    }

    if (this.modifiers.filter) {
      code += `.lpf(${this.modifiers.filter})`;
    }

    return code;
  }
}
```

---

## Audio Context Integration

Strudel creates its own Web Audio context. We need to:

1. **Let Strudel create the context** (via `initStrudel()`)
2. **Or pass our context** (if Strudel supports it - need to verify)

**Test Required**: Can we pass a custom AudioContext to Strudel?

```javascript
// Possible approach (needs verification)
const audioContext = new AudioContext();
await initStrudel({ audioContext });
```

If not supported, we use Strudel's internal context.

---

## Known Limitations

### 1. Global Namespace Pollution

CDN version loads Strudel functions globally:
- `note()`, `s()`, `sound()`, etc. are global
- All pattern functions available globally
- Can conflict with other libraries

**Mitigation**: Use TypeScript declarations to safely access globals

### 2. No Tree Shaking

CDN loads entire Strudel library (~several MB):
- Not optimized for bundle size
- Loads all samples/sounds

**Mitigation**: Accept larger initial load for MVP, optimize later

### 3. Version Pinning

Using CDN requires careful version management:
- Pin to specific version: `@strudel/web@1.2.6`
- Don't use `@latest` in production
- Document version in constants

---

## Alternative: Embed Approach

If CDN causes issues, we can embed the Strudel REPL:

```html
<iframe
  src="https://strudel.cc/?<pattern-code>"
  width="100%"
  height="400"
></iframe>
```

**Pros**: Guaranteed to work, no installation
**Cons**: Less control, iframe limitations, harder to integrate with MIDI

---

## Testing Checklist

Before proceeding with implementation:

- [x] Load Strudel via CDN in test HTML
- [x] Call `initStrudel()` successfully (with prebake option)
- [x] Evaluate simple pattern: `s('bd')` and `note('c4 e4 g4').s('arpy')`
- [x] Play and hear audio (drums, synths, melodic samples)
- [x] Stop pattern (using `.hush()` method)
- [x] Layer 2 patterns simultaneously
- [x] Modify pattern with `.fast()`, `.slow()`
- [x] Access from TypeScript with type safety (types.ts updated)

---

## Recommended Next Steps

1. **Create test HTML file** with CDN integration
2. **Verify audio works** in browser
3. **Test pattern layering** (2-3 patterns)
4. **Document actual API** from testing
5. **Update plan.md** with CDN approach
6. **Resume Phase 1.1** with correct integration method

---

## Resources

- **Official Docs**: https://strudel.cc/technical-manual/
- **Packages Info**: https://strudel.cc/technical-manual/packages/
- **CDN**: https://unpkg.com/@strudel/web@1.2.6
- **REPL**: https://strudel.cc/
- **GitHub (old)**: https://github.com/tidalcycles/strudel
- **Codeberg (current)**: https://codeberg.org/uzu/strudel

---

## Status

✅ **Research Complete**
✅ **Solution Identified** (CDN approach)
✅ **Testing Complete** (v2-v6 tests)
✅ **API Verified** (pattern.hush(), global hush(), prebake)
✅ **Working sounds documented**

---

## TESTING RESULTS (2025-11-02)

### Tests Performed

**v2**: Initial audio test (discovered clicking issue)
**v3**: API discovery (.play() returns object with .hush())
**v4**: Audio diagnostic (raw Web Audio vs Strudel)
**v5**: Fixed with prebake sample loading
**v6**: Sound palette discovery

### Critical API Discoveries

1. **initStrudel() REQUIRES prebake option**:
```javascript
await initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
});
```
Without this, patterns produce only clicking (scheduler running with no audio).

2. **Pattern control**:
- `.play()` returns the pattern object (NOT void)
- Pattern has `.hush()` method to stop it (NOT `.stop()`)
- Global `hush()` function stops all patterns
```javascript
const pattern = s('bd').play();  // Returns pattern object
pattern.hush();                  // Stop this pattern
hush();                          // Stop ALL patterns
```

3. **Pattern objects are chainable**:
```javascript
note('c4 e4 g4').s('arpy').fast(2).lpf(800).play()
```

### Working Sound Palette

✅ **Built-in Synths** (always work):
- `sine` - Smooth sine wave
- `sawtooth` - Buzzy synth (good for bass)
- `square` - Hollow synth
- `triangle` - Soft synth

✅ **Drum Samples** (from dirt-samples):
- `bd` - Kick drum
- `sd` - Snare
- `hh` - Hi-hat (open/closed)
- `cp` - Handclap (NOT `clap`)
- `rm` or `rs` - Rimshot (NOT `rim`)
- `cb` - Cowbell (NOT `cowbell`)
- `hc` - Handclap alternative
- `perc` - Percussion
- `oh` - Open hi-hat
- `tabla` - Tabla drum
- `click` - Click sound
- `sid` - Snare alternative
- And many more...

✅ **Melodic Samples** (from dirt-samples):
- `arpy` - Arpeggio synth ✅
- `bass` - Bass samples ✅
- `casio` - Casio keyboard ✅
- `gtr` - Guitar samples ✅

❌ **NOT Available** (don't exist in dirt-samples):
- `piano` - Does not exist (use `casio`, `gtr`, or `arpy`)
- `superpiano` - Does not exist
- `flbass` - Does not exist
- `clap` - Does not exist (use `cp` or `hc`)
- `rim` - Does not exist (use `rm` or `rs`)
- `cowbell` - Does not exist (use `cb`)

### Updated Default Pattern Library

All default patterns in `constants.ts` have been updated to use ONLY working sounds:
- Replaced `piano` with `casio`, `arpy`, or `gtr`
- Melodic patterns use synths (sine, sawtooth, triangle, square)
- Drum patterns use verified samples (bd, sd, hh, cp)

### TypeScript Types Updated

`app/src/lib/types.ts` now has correct API:
- `Pattern.play()` returns `Pattern` (not void)
- `Pattern.hush()` stops pattern (not `.stop()`)
- `initStrudel(options?: InitStrudelOptions)` with prebake
- Global `hush()` and `samples()` functions declared

---

**Critical Findings Summary**:
1. ❌ npm packages are BROKEN (dependency typo)
2. ✅ CDN approach WORKS and is officially recommended
3. ✅ Strudel uses mini notation (simple string patterns)
4. ✅ Can layer multiple patterns
5. ✅ Pattern control: `.play()` returns object with `.hush()`
6. ✅ Must use `prebake` option to load samples
7. ✅ Working sound palette documented (synths + dirt-samples)
8. ⚠️ Parameter control requires recreating patterns

**Ready to proceed with implementation!**
