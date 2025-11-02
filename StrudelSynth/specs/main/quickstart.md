# QuickStart Guide: StrudelSynth Development

**Last Updated**: 2025-11-02
**Target Audience**: Developers setting up StrudelSynth for the first time

This guide will get you from zero to triggering your first pattern with the APCKEY25 in under 15 minutes.

---

## Prerequisites

### Required

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Browser**: Chrome 90+, Edge 90+, or Opera (Web MIDI API required)
- **OS**: Windows, macOS, or Linux

### Optional

- **APCKEY25 MIDI Controller**: mk1 or mk2 (can develop without hardware using mocks)
- **Git**: For version control
- **VS Code**: Recommended editor with TypeScript support

### Check Your Setup

```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

---

## Installation

### 1. Clone the Repository

```bash
cd your-projects-directory
git clone https://github.com/your-org/StrudelSynth.git
cd StrudelSynth
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Svelte (UI framework)
- Vite (build tool)
- Strudel packages (`@strudel/core`, `@strudel/webaudio`, `@strudel/superdough`)
- ringbuf.js (lock-free MIDI→Audio communication)
- TypeScript, Vitest (testing)
- web-midi-test (MIDI mocking)

### 3. Configure HTTP Headers (Required for SharedArrayBuffer)

ringbuf.js requires SharedArrayBuffer, which needs specific HTTP headers.

**Development Server (Vite):**

Already configured in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  }
})
```

**Production:** Ensure your hosting platform sets these headers.

---

## Running the Development Server

### Start Dev Server

```bash
npm run dev
```

Output:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open http://localhost:5173/ in **Chrome, Edge, or Opera**.

### Grant MIDI Permissions

1. Browser will prompt: "localhost wants to access your MIDI devices"
2. Click **Allow**
3. If APCKEY25 is connected, it will be detected automatically

---

## Your First Pattern Trigger (15-Minute Tutorial)

### Step 1: Verify MIDI Connection (2 min)

**With Hardware:**
1. Open browser DevTools (F12)
2. Check console for: `MIDI device connected: APC Key 25`
3. Press any button on APCKEY25
4. Console shows: `Button press detected at slot X`

**Without Hardware (Mock):**
```bash
npm run dev:mock  # Uses web-midi-test mocks
```

### Step 2: Load a Test Pattern (3 min)

The app comes with default patterns. Open the UI:

1. Pattern Grid: 5×8 button grid displayed on screen
2. Pattern Library: Click "Load Examples"
3. Select "Kick Pattern" → Assign to Slot 0

Console output:
```
Pattern assigned to slot 0: Kick Pattern
Code: note("c2").s("bd")
```

### Step 3: Trigger the Pattern (2 min)

**Method A: Hardware**
- Press button at row 0, column 0 (top-left)
- LED turns green
- Kick drum plays

**Method B: On-Screen**
- Click slot 0 in the UI grid
- Button highlights green
- Kick drum plays

Console output:
```
Pattern started: slot=0, code=note("c2").s("bd")
Audio output: superdough synth active
```

### Step 4: Control with Knobs (3 min)

1. Ensure "Device Mode" is selected (default)
2. Rotate **Knob 1** (speed control)
   - Pattern speeds up/slows down in real-time
3. Rotate **Knob 2** (filter cutoff)
   - Sound brightness changes

Console output:
```
CC received: knob=1, value=85
Parameter updated: speed=1.34
```

### Step 5: Record a Melody (5 min)

1. Click "Record" button (or press dedicated record button on APCKEY25)
2. LED on target slot turns red (blinking)
3. Play notes on keyboard: C-E-G-C (simple major triad)
4. Click "Stop Recording"
5. Code automatically generated and displayed:

```javascript
note("c4 e4 g4 c5").velocity("0.79 0.71 0.75 0.87").s("piano")
```

6. Pattern plays back immediately
7. LED turns green

---

## Project Structure Overview

```
StrudelSynth/
├── src/
│   ├── midi/                    # MIDI controller management
│   │   ├── MIDIControllerManager.ts
│   │   ├── APCKey25Mapper.ts
│   │   └── devices/
│   │       └── apckey25-mk2.json
│   │
│   ├── pattern/                 # Pattern slots & triggers
│   │   ├── PatternSlotManager.ts
│   │   └── PatternTrigger.ts
│   │
│   ├── transcription/           # MIDI → Strudel code
│   │   └── StrudelCodeGenerator.ts
│   │
│   ├── visualizer/              # LED visualizations
│   │   └── LEDVisualizer.ts
│   │
│   ├── ui/                      # Svelte components
│   │   └── components/
│   │       ├── PatternGrid.svelte
│   │       └── KnobBank.svelte
│   │
│   └── main.ts                  # App entry point
│
├── tests/                       # Test files
├── specs/                       # Documentation (you are here!)
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Common Development Tasks

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Lint & Format

```bash
npm run lint        # Check for errors
npm run format      # Auto-format code
```

### Type Check

```bash
npm run type-check  # TypeScript validation
```

---

## Troubleshooting

### "Web MIDI API not supported"

**Problem**: Using Firefox or Safari
**Solution**: Use Chrome, Edge, or Opera (only browsers with Web MIDI API)

### "MIDI access denied"

**Problem**: Browser permissions not granted
**Solution**:
1. Click lock icon in address bar
2. Reset permissions
3. Refresh page
4. Click "Allow" when prompted

### "SharedArrayBuffer is not defined"

**Problem**: Missing Cross-Origin headers
**Solution**:
1. Check `vite.config.ts` has correct headers
2. Restart dev server: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

### "APCKEY25 not detected"

**Problem**: Device not connected or permissions issue
**Solution**:
1. Check USB cable connection
2. Verify device shows in OS MIDI settings
3. Restart browser
4. Use mock mode: `npm run dev:mock`

### No Audio Output

**Problem**: Web Audio context not started
**Solution**:
1. Click anywhere on the page (user gesture required)
2. Check browser console for audio errors
3. Verify volume/mute settings

---

## Next Steps

### Tutorial: Build a Custom Pattern

See `docs/tutorials/custom-pattern.md` for step-by-step guide to creating patterns programmatically.

### Tutorial: MIDI Learn Custom Mapping

See `docs/tutorials/midi-learn.md` to assign knobs to custom parameters.

### API Documentation

- MIDI Controller API: `specs/main/contracts/midi-controller-api.md`
- Pattern Engine API: `specs/main/contracts/pattern-engine-api.md`
- Transcription API: `specs/main/contracts/transcription-api.md`
- Visualizer API: `specs/main/contracts/visualizer-api.md`

### Contributing

1. Read `CONTRIBUTING.md` (TDD workflow, constitution compliance)
2. Check open issues on GitHub
3. Join Discord community (link in README)

---

## Quick Reference

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Stop all patterns |
| `R` | Start recording |
| `Esc` | Stop recording |
| `1-8` | Trigger patterns in row 1 |
| `Shift+1-8` | Stop patterns in row 1 |

### Default Knob Mappings (Device Mode)

| Knob | Parameter | Range |
|------|-----------|-------|
| 1 | Speed | 0.5x - 2.0x |
| 2 | Filter Cutoff | 200Hz - 8kHz |
| 3 | Resonance | 0 - 20 |
| 4 | Delay | 0 - 90% |
| 5 | Reverb | 0 - 90% |
| 6 | Distortion | 0 - 100% |
| 7 | Pan | L100 - R100 |
| 8 | Gain | 0 - 150% |

### Pattern State Colors

| State | LED Color | Description |
|-------|-----------|-------------|
| Empty | Off | No pattern assigned |
| Loaded | Amber | Pattern ready, not playing |
| Playing | Green | Pattern actively playing |
| Recording | Red (blink) | Capturing MIDI input |
| Error | Red (pulse) | Pattern evaluation failed |

---

**Need Help?**
- Check `docs/FAQ.md`
- Search issues: https://github.com/your-org/StrudelSynth/issues
- Discord: https://discord.gg/your-invite

**Happy live coding! 🎵**
