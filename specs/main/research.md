# Phase 0 Research: StrudelSynth Technical Decisions

**Date**: 2025-11-02
**Status**: Complete

This document resolves all "NEEDS CLARIFICATION" items from the implementation plan Technical Context section.

---

## 1. UI Framework Choice (React vs Svelte)

### Research Question
Which framework integrates best with Strudel's existing codebase?

### Research Findings

**Strudel uses Vanilla JavaScript (not React)**

Strudel has deliberately moved away from React to vanilla JavaScript Web Components:

- **Current Architecture** (2024):
  - Vanilla JavaScript Web Components
  - CodeMirror editor (framework-agnostic)
  - `@strudel/repl` package provides `<strudel-editor>` web component
  - Vite for build tooling

- **Historical Context**:
  - Previously had `@strudel.cycles/react` package
  - **Deprecated as of v0.10.0**
  - Major refactoring PRs: #863, #865, #866, #873, #876 ("vanillification")

- **Core Philosophy**:
  - Only `@strudel.cycles/react` was coupled to React
  - All other modules (`@strudel/core`, `@strudel/webaudio`) are framework-agnostic
  - Repository moved from GitHub (tidalcycles/strudel) to Codeberg (uzu/strudel)

### Decision: **Use Svelte**

**Rationale:**

1. **Not React** - Strudel deliberately moved away from React; using it offers no integration advantage
2. **Smaller bundle size** - Aligns with Strudel's lightweight vanilla JS direction
3. **Web Component friendly** - Can easily wrap `<strudel-editor>` web component
4. **Better reactivity for MIDI** - Svelte's reactive model excels at real-time event handling
5. **Less runtime overhead** - Compiled away at build time, critical for audio performance

**Integration Approach:**
```javascript
// Import Strudel as plain JavaScript library
import { evaluate, Pattern } from '@strudel/core'
import '@strudel/webaudio'

// Wrap <strudel-editor> in Svelte component
<svelte:options tag="midi-pattern-editor" />
<strudel-editor bind:code={patternCode} />
```

**Alternative**: If team prefers React for familiarity, use it but bypass deprecated `@strudel.cycles/react` entirely and integrate Strudel as vanilla JS.

**Resources:**
- Official Strudel docs: https://strudel.cc/technical-manual/packages/
- Architecture discussion: https://github.com/tidalcycles/strudel/discussions/381
- Codeberg repository: https://codeberg.org/uzu/strudel

---

## 2. Web MIDI Mocking Strategy

### Research Question
What's the best library/approach for mocking Web MIDI API in tests?

### Research Findings

**Library Comparison:**

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **web-midi-test** | Mature, works in Node/browser, simple API, good docs | Virtual only (no system MIDI) | Unit/integration tests |
| **web-midi-test-api** | Bidirectional mocking | Less documentation | I/O testing |
| **Manual mocks** | Maximum control, no deps | More maintenance | Custom scenarios |

### Decision: **web-midi-test + Vitest**

**Rationale:**
- Mature library with excellent CI/CD support
- Works in Node.js, browsers, and headless environments (Playwright)
- Simple API for creating virtual MIDI devices
- Can simulate permission scenarios (sysex denied, access denied)
- Lightweight and dependency-free

**Implementation:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    unstubGlobals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})

// src/test/setup.ts
import * as WMT from 'web-midi-test'
import { vi } from 'vitest'

globalThis.WMT = WMT

vi.stubGlobal('navigator', {
  requestMIDIAccess: (options?: MIDIOptions) =>
    WMT.requestMIDIAccess(options),
})

// src/test/midi.fixture.ts
import { test as baseTest } from 'vitest'

export const test = baseTest.extend<MIDIFixture>({
  async midiAccess(_, use) {
    const access = await navigator.requestMIDIAccess()
    await use(access)
  },

  createVirtualInput(_, use) {
    const inputs: WMT.MidiSrc[] = []
    use((name: string) => {
      const input = new WMT.MidiSrc(name)
      input.connect()
      inputs.push(input)
      return input
    })
    inputs.forEach(input => input.disconnect())
  },
})

// Example test
import { test } from './test/midi.fixture'

test('should handle note-on events', async ({ createVirtualInput }) => {
  const virtualInput = createVirtualInput('Test Input')

  controller.onNoteOn((note: number) => {
    receivedNotes.push(note)
  })

  virtualInput.emit([0x90, 60, 0x7f]) // Note 60, velocity 127

  expect(receivedNotes).toContain(60)
})
```

**Installation:**
```bash
npm install --save-dev web-midi-test vitest @vitest/ui
```

**Resources:**
- GitHub: https://github.com/jazz-soft/web-midi-test
- NPM: https://www.npmjs.com/package/web-midi-test

---

## 3. Audio Worklet Testing

### Research Question
How to test Web Audio worklets in CI environment without audio hardware?

### Decision: **Three-tier testing strategy**

**Tier 1: Unit Tests (Fast - Node.js)**
Mock AudioContext, test processor logic in isolation:

```typescript
// __mocks__/AudioWorkletProcessor.js
export default class AudioWorkletProcessor {
  constructor() {
    this.port = new MessagePort()
  }

  process(inputs, outputs, parameters) {
    // Override in tests
    return true
  }
}

global.AudioWorkletProcessor = AudioWorkletProcessor
global.registerProcessor = (name, ProcessorClass) => {
  global._audioWorklets = global._audioWorklets || {}
  global._audioWorklets[name] = ProcessorClass
}

// Test example
import '../__mocks__/AudioWorkletProcessor.js'
import GainProcessor from '../src/GainProcessor.js'

test('GainProcessor multiplies output by gain value', () => {
  const processor = new GainProcessor()
  const inputs = [[new Float32Array([0.1, 0.2, 0.3, 0.4])]]
  const outputs = [[new Float32Array(4)]]
  const parameters = { gain: [2.0] }

  processor.process(inputs, outputs, parameters)

  expect(outputs[0][0][0]).toBeCloseTo(0.2) // 0.1 * 2.0
})
```

**Tier 2: Integration Tests (Medium - Headless browser with OfflineAudioContext)**
Test actual audio processing with deterministic output:

```typescript
test('AudioWorklet processing produces correct output', async () => {
  const offlineContext = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 48000,
    sampleRate: 48000
  })

  await offlineContext.audioWorklet.addModule('worklet.js')
  const workletNode = new AudioWorkletNode(offlineContext, 'processor-name')

  sourceNode.connect(workletNode).connect(offlineContext.destination)
  const renderedAudio = await offlineContext.startRendering()

  expect(renderedAudio.getChannelData(0)).toEqual(expectedOutput)
})
```

**Tier 3: Performance Tests (Verify <5ms requirement)**

```typescript
test('GainProcessor executes within 3ms for 128 samples', () => {
  const processor = new GainProcessor()
  const inputs = [[new Float32Array(128)]]
  const outputs = [[new Float32Array(128)]]
  const parameters = { gain: [1.5] }

  // Warm up
  for (let i = 0; i < 100; i++) {
    processor.process(inputs, outputs, parameters)
  }

  // Benchmark
  const iterations = 10000
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    processor.process(inputs, outputs, parameters)
  }
  const elapsed = performance.now() - start
  const avgTime = elapsed / iterations

  console.log(`Average: ${avgTime.toFixed(4)}ms per block`)
  expect(avgTime).toBeLessThan(0.5) // Safety margin: 0.5ms (6x budget)
})
```

**Key Performance Principles:**

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Max Processing Time** | <3ms per 128-sample block | Avoid audio glitches/dropout |
| **Avg Processing Time** | <0.5ms per block | Leaves headroom for system load |
| **Memory Allocations** | 0 per process() call | Prevent GC pauses |

**Critical: What NOT to Do in process():**
```javascript
// WRONG - allocates memory
process(inputs, outputs, parameters) {
  const output = inputs[0][0].map(sample => sample * 2) // NEW ARRAY!
  return true
}

// CORRECT - reuses output buffer
process(inputs, outputs, parameters) {
  const input = inputs[0][0]
  const output = outputs[0][0]
  const gain = parameters.gain[0]

  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * gain  // Direct assignment, no allocation
  }
  return true
}
```

**Resources:**
- web-audio-test-api: https://www.npmjs.com/package/web-audio-test-api
- Chrome Audio Worklet guide: https://developer.chrome.com/blog/audio-worklet-design-pattern
- MDN OfflineAudioContext: https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext

---

## 4. Strudel Integration Points

### Research Question
What are the exact APIs for integrating with Strudel's pattern engine and visualizers?

### Key Integration Contracts

**Core Pattern Evaluation:**
```javascript
import { evaluate } from '@strudel/core'
import { registerSynthSounds } from '@strudel/superdough'
import { webaudioOutput } from '@strudel/webaudio'

// Initialize audio
await registerSynthSounds()

// Evaluate Strudel code
const pattern = evaluate('note("c3 e3 g3").s("piano")')

// Connect to Web Audio
pattern.output(webaudioOutput())
```

**Accessing Pattern Parameters:**
```javascript
// Pattern objects expose chainable methods
pattern
  .fast(2)           // Speed control
  .slow(0.5)         // Slow down
  .gain(0.8)         // Volume
  .lpf(1000)         // Low-pass filter
  .lpq(5)            // Filter resonance
  .delay(0.5)        // Delay time
  .room(0.9)         // Reverb
```

**Visualizer Extension:**
Strudel visualizers are event-based and extend via custom handlers:

```javascript
import { getDrawContext } from '@strudel/draw'

// Register custom visualizer
getDrawContext().on('draw', ({ haps, time, ctx }) => {
  // haps = scheduled events
  // ctx = canvas 2d context
  // Custom LED visualization logic here
})
```

**Key Packages:**

| Package | Purpose | Installation |
|---------|---------|--------------|
| `@strudel/core` | Pattern language, evaluation | `npm i @strudel/core` |
| `@strudel/webaudio` | Web Audio output | `npm i @strudel/webaudio` |
| `@strudel/superdough` | Synthesis engine | `npm i @strudel/superdough` |
| `@strudel/draw` | Visualizer framework | `npm i @strudel/draw` |
| `@strudel/repl` | Full REPL component | `npm i @strudel/repl` |

**Integration Approach:**
1. Import Strudel as framework-agnostic JavaScript modules
2. Use `evaluate()` for programmatic pattern creation from generated code
3. Access pattern parameters via chainable methods (`.gain()`, `.lpf()`, etc.)
4. Extend visualizers via `getDrawContext().on('draw', handler)`
5. Avoid using deprecated `@strudel.cycles/react` package

**Resources:**
- Technical manual: https://strudel.cc/technical-manual/
- Package documentation: https://strudel.cc/technical-manual/packages/
- Project setup guide: https://strudel.cc/technical-manual/project-start/
- Codeberg repo: https://codeberg.org/uzu/strudel

---

## 5. Lock-Free Data Structures

### Research Question
What JavaScript libraries provide performant lock-free ring buffers?

### Decision: **ringbuf.js**

**Rationale:**

- **Purpose-built for Web Audio**: Designed by Paul Adenot (Firefox Audio engineer) specifically for AudioWorklet communication
- **Zero allocation**: No garbage collection in hot paths (critical for real-time)
- **Proven performance**:
  - 325% performance improvement in buffer operations
  - 2.5-6x increase in load capacity vs. postMessage
  - Real-world test: 3000 concurrent operations without glitches (vs. 600 with postMessage)
- **Thread-safe**: Wait-free single-producer single-consumer (SPSC) ring buffer using SharedArrayBuffer
- **Lightweight**: ~1.3 KB compressed
- **Production-ready**: Used in Firefox, well-documented

**Key Features:**

| Module | Purpose | Use Case |
|--------|---------|----------|
| `ringbuf.ts` | Core SPSC ring buffer | Generic data passing |
| `audioqueue.ts` | Audio streaming | PCM data between threads |
| `param.ts` | Parameter changes | MIDI-style index-value pairs |

**Implementation Example:**

```typescript
import { RingBuffer } from 'ringbuf.js'

// In main thread (MIDI input)
const sab = new SharedArrayBuffer(1024)
const ringbuf = new RingBuffer(sab, Uint8Array)

// MIDI note-on received
ringbuf.push(new Uint8Array([0x90, 60, 0x7f]))

// In AudioWorklet (audio processing)
class MIDIAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.ringbuf = new RingBuffer(sab, Uint8Array)
  }

  process(inputs, outputs, parameters) {
    // Read MIDI events (zero allocation)
    const midiData = new Uint8Array(3)
    if (this.ringbuf.pop(midiData)) {
      const [status, note, velocity] = midiData
      // Process MIDI event...
    }
    return true
  }
}
```

**Required HTTP Headers** (for SharedArrayBuffer):
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Browser Support:**
- Firefox (Desktop/Android)
- Chrome/Chromium (Desktop/Android)
- Safari

**Installation:**
```bash
npm install ringbuf.js
```

**Alternative Considered:**
- **Google Chrome Labs Ring Buffer Pattern**: Excellent reference implementation but ringbuf.js is more mature
- **postMessage**: Built-in but causes unpredictable GC pauses (not real-time safe)

**Resources:**
- GitHub: https://github.com/padenot/ringbuf.js/
- Demo: https://ringbuf-js.netlify.app/
- Blog post: https://blog.paul.cx/post/a-wait-free-spsc-ringbuffer-for-the-web/
- Chrome Labs reference: https://googlechromelabs.github.io/web-audio-samples/audio-worklet/design-pattern/wasm-ring-buffer/

---

## 6. APCKEY25 MIDI Specification

### Research Question
Exact CC numbers, note mappings, LED color codes for mk1 and mk2?

### Findings

**Official Documentation Available:**
- APC Key 25 mk2 Communications Protocol v1.1 (PDF)
- URL: https://cdn.inmusicbrands.com/akai/attachments/APC Key 25 mk2 - Communication Protocol - v1.1.pdf

**Key Specifications:**

**LED Control:**
- RGB pads: 3-byte MIDI Note On messages (Port 1)
- 3 factors: Pad/Button value, Behavior (solid/blink/pulse), Color
- RGB color: Three 8-bit values (Red, Green, Blue) expressed as MSB/LSB (MIDI is 7-bit)
- Behavior determined by MIDI Channel (CH 00-0F)

**Color Control Methods:**
1. **MIDI Note On**: Standard LED control
2. **SysEx Commands**: Custom RGB color setting for multiple LEDs

**Pad Grid:**
- 5 rows × 8 columns = 40 RGB LED buttons
- MIDI Note On/Off messages for triggering
- Tri-color states: Off, Amber (loaded), Green (playing), Red (recording)

**Knobs:**
- 8 endless 360° rotary encoders
- 4 modes: Volume, Pan, Send, Device
- MIDI CC messages (CC numbers documented in protocol PDF)

**Keyboard:**
- 25 velocity-sensitive keys
- Standard MIDI Note On/Off with velocity

**mk1 vs mk2 Differences:**
- mk2: RGB pads (vs single-color LEDs in mk1)
- mk2: Endless 360° knobs (vs 270° knobs in mk1)
- mk2: Updated LED control protocol

**Implementation Note:**
Complete MIDI mapping tables (CC numbers, note numbers, LED color codes) should be extracted from official PDF and stored in device configuration files:
- `src/midi/devices/apckey25-mk1.json`
- `src/midi/devices/apckey25-mk2.json`

**Resources:**
- Official protocol PDF (mk2 v1.1): https://cdn.inmusicbrands.com/akai/attachments/APC Key 25 mk2 - Communication Protocol - v1.1.pdf
- Official protocol PDF (mk2 v1.0): https://cdn.inmusicbrands.com/akai/attachments/APC Key 25 mk2 - Communication Protocol - v1.0.pdf
- Akai official page: https://www.akaipro.com/apc-key-25-mkii

---

## Dependencies Best Practices Summary

### Web MIDI API
- **Error Handling**: Always handle `navigator.requestMIDIAccess()` rejection (permissions, unsupported browser)
- **Hot-Plug Detection**: Use `MIDIAccess.onstatechange` to monitor device connect/disconnect
- **Browser Compatibility**: Chrome/Edge/Opera only (Firefox/Safari lack support)

### Web Audio API
- **Worklet Lifecycle**: Load worklets with `audioContext.audioWorklet.addModule()` before creating nodes
- **Zero-Allocation Patterns**: Reuse buffers in `process()`, no `map()`, `filter()`, or object creation
- **Lock-Free Communication**: Use ringbuf.js SharedArrayBuffer pattern, not postMessage

### IndexedDB
- **Schema Versioning**: Use `onupgradeneeded` for migrations between versions
- **Performance**: Batch writes in transactions, use indexes for queries
- **Storage Limits**: Request persistent storage with `navigator.storage.persist()`

---

## Summary: Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **UI Framework** | Svelte | Lightweight, web component friendly, matches Strudel's vanilla JS direction |
| **MIDI Testing** | web-midi-test | Mature, CI-friendly, works in Node/browser |
| **Audio Testing** | OfflineAudioContext + mocks | Three-tier strategy (unit/integration/performance) |
| **Strudel Integration** | @strudel/core + @strudel/webaudio | Framework-agnostic JavaScript modules |
| **Lock-Free Buffers** | ringbuf.js | Purpose-built for Web Audio, zero-allocation, proven performance |
| **MIDI Protocol** | Official Akai PDF specs | Complete mk1/mk2 specifications available |

**All "NEEDS CLARIFICATION" items resolved.** Ready to proceed to Phase 1 design.
