# Phase 1 MVP Design Decisions

**Date**: 2025-11-02
**Status**: ✅ All core decisions finalized
**Ready for**: Implementation planning

---

## Overview

All critical design decisions for Phase 1 MVP have been made. This document summarizes the choices that will guide implementation.

---

## 1. Pattern Management Strategy

**Decision**: Text Editor + JSON Import/Export

### What This Means:

- **Default Patterns**: 8-12 pre-written Strudel examples included
  - Examples: `s("bd sd")`, `note("c4 e4 g4").s("piano")`, etc.
  - Cover drums, bass, melody, effects

- **Pattern Editor**:
  - Simple `<textarea>` for editing Strudel code
  - Click pattern slot → Edit inline
  - Save/Clear buttons per slot
  - No syntax highlighting required (can add later)

- **JSON Import/Export**:
  - "Export Setup" → Download complete 40-slot configuration
  - "Import Setup" → Load saved performance setups
  - Format: Per data-model.md specification

- **Pattern Library**:
  - Dropdown of example patterns
  - "Load Example" copies pattern to selected slot

### Implementation Priority:
- ✅ **Phase 1 MVP**: Editor + hardcoded examples + export/import
- 🔄 **Phase 1.5** (optional): Syntax highlighting, autocomplete
- 🔄 **Phase 2**: MIDI recording replaces manual editing for some workflows

---

## 2. Audio Initialization Flow

**Decision**: Click-to-Start Overlay

### User Experience:

**Page Load:**
```
┌───────────────────────────────────────┐
│                                       │
│          StrudelSynth                 │
│                                       │
│   Click anywhere to enable audio      │
│                                       │
│      [Audio waveform icon 🎵]         │
│                                       │
└───────────────────────────────────────┘
```

**After Click:**
1. Initialize AudioContext
2. Resume audio context (required by browsers)
3. Initialize Strudel engine
4. Connect MIDI devices (both keyboard + controller)
5. Hide overlay → Show main UI

### Technical Details:

```typescript
overlay.addEventListener('click', async () => {
  try {
    audioContext = new AudioContext();
    await audioContext.resume();
    await initStrudel(audioContext);
    await connectMIDI();
    overlay.hide();
  } catch (error) {
    showErrorModal("Audio initialization failed: " + error.message);
  }
});
```

- **Buffer Size**: Use browser defaults (128-256 samples)
- **Don't override** unless latency testing shows issues
- **Monitor latency** in dev tools during development

### Edge Cases:
- Audio fails → Show error modal with browser compatibility info
- User refreshes before click → Show overlay again

---

## 3. Error Handling Strategy

### 3a. Pattern Code Evaluation Errors

**Decision**: Inline Error Display

**Behavior:**
- Pattern fails to evaluate (syntax error, etc.)
- Error shows inline near pattern editor
- Pattern stays in slot (preserved for debugging)
- Button LED turns **red** (velocity 5)
- Other patterns continue playing

**UI:**
```
┌─────────────────────────────────────┐
│ Pattern Slot 5                      │
│                                     │
│ note("c4 e4").fasttttt(2)          │
│                                     │
│ ❌ Error: fasttttt is not defined  │
│    Did you mean: fast()?            │
│                                     │
│ [Edit] [Clear] [Try Again]          │
└─────────────────────────────────────┘
```

**Code:**
```typescript
try {
  pattern = await strudelEval(code);
  setLED(slotIndex, LED_COLORS.YELLOW);  // Loaded
} catch (error) {
  showInlineError(slotIndex, error.message);
  setLED(slotIndex, LED_COLORS.RED);  // Error
}
```

---

### 3b. MIDI Device Disconnection

**Decision**: Continue Audio + Warning Banner

**Behavior:**
- MIDI controller unplugged during performance
- **Audio playback CONTINUES** (patterns keep playing)
- Warning banner appears at top
- LED states lost (hardware unplugged)
- Auto-reconnect when device plugged back in
- LED states restored on reconnect

**UI:**
```
┌────────────────────────────────────────────────┐
│ ⚠️ MIDI controller disconnected.               │
│    Audio continues. Replug USB to restore.  [✕]│
└────────────────────────────────────────────────┘
```

**Code:**
```typescript
midiAccess.onstatechange = (event) => {
  if (event.port.state === 'disconnected') {
    showBanner('warning', 'MIDI disconnected. Audio continues.');
    deviceStatus.connected = false;
    ledUpdatesEnabled = false;
  }

  if (event.port.state === 'connected') {
    await reconnectDevice(event.port);
    restoreAllLEDs();
    hideBanner();
  }
};
```

---

## 4. APCKEY25 mk2 Hardware Integration

**Critical Discovery**: Dual MIDI Device Architecture

### Device Breakdown:

| Device Name | Purpose | Your Code Needs To: |
|-------------|---------|---------------------|
| **"APC Key 25 mk2"** | Keyboard (25 keys) | Listen for note input (notes 1-120) |
| **"MIDIIN2"** | Buttons + knobs | Listen for button presses (notes 0-39) + knob CC (48-55) |
| **"MIDIOUT2"** | LED control | Send LED commands (Note On messages) |

### Implementation Requirements:

✅ **Must connect to BOTH devices simultaneously**
✅ **LED commands go to "MIDIOUT2" NOT the keyboard device**
✅ **Different event handlers for keyboard vs. buttons/knobs**

**See**: `specs/main/hardware/DUAL-DEVICE-ARCHITECTURE.md` for complete guide

---

## 5. LED Color Scheme

**Decision**: Use velocity-based color palette from testing

### Core Colors (from spec.md requirements):

| State | Color | Velocity | Usage |
|-------|-------|----------|-------|
| Empty slot | OFF | 0 | No pattern assigned |
| Loaded | Bright Yellow | 96 | Pattern ready, not playing |
| Playing | Bright Green | 13 | Pattern actively playing |
| Recording | Red | 5 | Capturing MIDI input (Phase 2) |
| Error | Red | 5 | Pattern evaluation failed |

### Implementation:

```typescript
const LED_COLORS = {
  OFF: 0,
  RED: 5,
  GREEN: 13,
  YELLOW: 96
};

function setLED(slotIndex: number, color: number) {
  const noteNumber = slotIndexToNote(slotIndex);
  midiOutput2.send([0x90, noteNumber, color]);  // To MIDIOUT2!
}
```

**See**: `specs/main/hardware/LED-QUICK-REFERENCE.md` for all colors and examples

---

## 6. Phase 1 Scope Confirmation

### What's IN Phase 1 MVP:

✅ Web MIDI API integration (dual device)
✅ APCKEY25 device detection & connection
✅ 40-slot pattern management
✅ Button → Pattern triggering
✅ Pattern editor (text area)
✅ JSON import/export (save/load setups)
✅ 8-12 default example patterns
✅ LED feedback (yellow/green/red states)
✅ Knob → Parameter control (basic)
✅ Error handling (inline + banner)
✅ Click-to-start audio initialization

### What's DEFERRED to Phase 2:

🔄 MIDI note recording from keyboard
🔄 Auto-transcription (MIDI → Strudel code)
🔄 Quantization
🔄 Overdub recording
🔄 Audio-reactive LED visualizations
🔄 Advanced knob modes (Volume/Pan/Send)

---

## 7. Technology Stack Confirmed

### Core Technologies:

- **Framework**: Svelte
- **Build Tool**: Vite
- **Language**: TypeScript
- **Audio**: Web Audio API
- **MIDI**: Web MIDI API
- **Synthesis**: Strudel (@strudel/core, @strudel/webaudio, @strudel/superdough)
- **State**: Svelte stores + IndexedDB (for persistence)

### Browser Support:

- ✅ Chrome 90+ (recommended)
- ✅ Edge 90+
- ✅ Opera
- ❌ Firefox (no Web MIDI API)
- ❌ Safari (no Web MIDI API)

**Note**: Document browser requirements clearly for users

---

## 8. Data Persistence Strategy

### What Gets Saved:

**IndexedDB** (persistent across sessions):
- 40 pattern slots (code + metadata)
- Knob mappings (CC → parameter assignments)
- User settings (last used mode, preferences)

**LocalStorage** (lightweight settings):
- Last knob mode used
- UI preferences
- Default tempo

**JSON Export** (user-initiated):
- Complete performance setup (40 patterns + knob config)
- Shareable with other users

### What's Session-Only:

- Current connection state (MIDI devices)
- Active pattern playback state
- LED states (restored on reconnect)

---

## Decision Summary Table

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Q1**: Export setups? | Yes - JSON format | Essential for live performers |
| **Q2**: Code edit behavior? | Code becomes independent | Prevents complexity of bi-directional sync |
| **Q3**: MIDI clock out? | Phase 2 | Focus on input first |
| **Q4**: Quantization grids? | Multiple grids + triplets | Flexibility for different styles |
| **Q5**: Multiple controllers? | Phase 2 | Single controller for MVP |
| **Q8**: Pattern source? | Text editor + JSON import | Maximum flexibility |
| **Q9**: Audio init? | Click-to-start overlay | Standard, clear UX |
| **Q10a**: Code errors? | Inline display | Non-intrusive |
| **Q10b**: MIDI disconnect? | Continue audio + banner | Performance continues |

---

## Next Steps

### Immediate:

1. ✅ Hardware protocol documented (RT-2)
2. ✅ Design decisions finalized (Q8-Q10)

### Upcoming:

3. **Strudel API Research** (RT-1):
   - How to evaluate patterns programmatically
   - How to control parameters in real-time
   - How to layer multiple patterns
   - Estimated: 4-8 hours

4. **Create Implementation Plan**:
   - Use `/speckit.plan` to generate tasks
   - Break down Phase 1 into implementable chunks
   - Prioritize tasks for MVP

---

## Files Created During Clarification

- ✅ `clarifications.md` - This decisions document
- ✅ `hardware/apckey25-mk2-protocol.md` - Complete MIDI protocol
- ✅ `hardware/DUAL-DEVICE-ARCHITECTURE.md` - Critical implementation guide
- ✅ `hardware/LED-QUICK-REFERENCE.md` - LED color codes
- ✅ `src/midi/devices/apckey25-mk2.json` - Device configuration
- ✅ `PHASE1-MVP-DECISIONS.md` - This summary

---

**Status**: 🎉 **Ready for implementation planning!**

All blocking questions resolved. You can now:
- Proceed with Strudel API research (optional but recommended)
- OR create the implementation plan immediately
- OR start prototyping with the decisions documented here

**Recommended**: Do Strudel API research first to validate technical feasibility, then create implementation plan.
