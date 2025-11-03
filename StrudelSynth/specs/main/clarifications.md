# Specification Clarifications

**Date**: 2025-11-02
**Status**: In Progress
**Related**: [spec.md](./spec.md), [data-model.md](./data-model.md)

This document captures clarifications and decisions made during the specification review process.

---

## Answered Questions

### Q1: Performance Setup Export/Import ✅

**Decision**: Yes - JSON format for Phase 1

**Rationale**: Essential for live performers who prepare sets in advance. Export/import will use the format defined in data-model.md:486-508.

**Implementation**:
- Export: Serialize all 40 pattern slots + knob mappings to JSON
- Import: Validate JSON schema, load patterns, restore knob mappings
- File format: `.strudelsynth` extension (JSON internally)

---

### Q2: Edited Code Behavior ✅

**Decision**: Code becomes independent (recommended)

**Rationale**:
- Prevents complexity of reverse-transcription (Strudel → MIDI)
- Strudel has features (`.fast()`, `.rev()`, `.jux()`) that don't map to MIDI
- Original MIDI recording preserved as history but not linked after edit

**Implementation**:
- Pattern entity has `source` field: `'midi'` | `'code'` | `'hybrid'`
- On first edit of generated code: `source` changes from `'midi'` to `'hybrid'`
- MIDI Recording remains in database for reference but doesn't sync

**User Flow**:
1. User records MIDI sequence → `source = 'midi'`
2. System generates Strudel code → still `source = 'midi'`
3. User edits code → `source = 'hybrid'` (MIDI + manual edits)
4. Further edits → code and MIDI diverge

---

### Q3: MIDI Clock Output ✅

**Decision**: Phase 2 feature - not in MVP

**Rationale**: Focus on input first. Sending MIDI clock to sync external gear is advanced functionality.

---

### Q4: Quantization Grids ✅

**Decision**: Support multiple grids including triplets in Phase 1

**Supported Grids**:
- 1/4 note (quarter notes)
- 1/8 note (eighth notes)
- 1/16 note (sixteenth notes) - default
- 1/32 note (thirty-second notes)
- Triplet modes (1/8T, 1/16T)

**Implementation**:
- UI dropdown: "Quantize: [1/16 ▾]"
- Apply quantization on recording stop (non-destructive - original timing preserved)
- Option to toggle quantization on/off per pattern

---

### Q5: Multiple Controllers ✅

**Decision**: Phase 2 - single controller for MVP

**Rationale**: Simplifies device management logic. Most live coders use one controller.

---

## New Questions Requiring Clarification

### Q6: Strudel Integration Specifics 🔴 NEEDS RESEARCH

**Context**: The spec assumes Strudel integration but lacks implementation details.

**Questions to Answer**:

1. **Which Strudel packages are required?**
   - [ ] Research: Check Strudel's npm packages
   - [ ] Identify minimum required packages for Phase 1
   - [ ] Document version compatibility

2. **How to evaluate Strudel patterns programmatically?**
   - [ ] Research: Strudel pattern evaluation API
   - [ ] Test: Can patterns be started/stopped individually?
   - [ ] Test: How to layer multiple patterns?

3. **Which parameters can be controlled in real-time?**
   - [ ] Research: List all Strudel modifiable parameters
   - [ ] Map parameters to knobs (8 knobs × 4 modes = 32 mappings needed)
   - [ ] Test: Latency of parameter updates

4. **How to integrate with Web Audio API?**
   - [ ] Research: Does Strudel provide WebAudio nodes?
   - [ ] Test: Can we tap into Strudel's audio output for visualization?

**Action Items**:
- [ ] Install Strudel packages locally
- [ ] Create proof-of-concept: trigger a single pattern from JavaScript
- [ ] Document findings in `research/strudel-api.md`

---

### Q7: APCKEY25 mk2 MIDI Protocol 🔴 NEEDS HARDWARE TESTING

**Context**: LED control and button mapping are hardware-specific.

**Questions to Answer**:

1. **What are the MIDI note numbers for the 5×8 button grid?**
   - [ ] Test: Press each button, log MIDI note number
   - [ ] Create mapping table: `{ row, col } → MIDI note`
   - [ ] Document in `devices/apckey25-mk2.json`

2. **How to control RGB LEDs via MIDI?**
   - [ ] Test: Send MIDI Note On with different velocities
   - [ ] Test: Does mk2 support RGB, or only preset colors?
   - [ ] Document LED control protocol

3. **What are the CC numbers for the 8 knobs?**
   - [ ] Test: Rotate each knob, log CC number
   - [ ] Test: Do CC numbers change with knob mode?
   - [ ] Create mapping table: `knobIndex → CC number`

4. **How do knob modes work?**
   - [ ] Test: Press mode buttons, observe behavior
   - [ ] Document: Are modes hardware-based or software-based?

**Action Items**:
- [ ] Connect APCKEY25 mk2 to computer
- [ ] Use MIDI monitor tool to capture messages
- [ ] Document protocol in `specs/main/hardware/apckey25-mk2-protocol.md`

---

### Q8: Phase 1 Pattern Management ✅ RESOLVED

**Context**: Phase 1 spec says "trigger pre-coded Strudel patterns" but doesn't specify how patterns are created/edited.

**Decision**: Text editor + JSON import/export

**Implementation Details**:

1. **Default Patterns**: Provide 8-12 pre-written Strudel patterns as examples
   - Cover different pattern types: drums, bass, melody, effects
   - Simple enough to understand, complex enough to be musical
   - Examples: `note("c4 e4 g4").s("piano")`, `s("bd sd").fast(2)`

2. **Pattern Editor UI**:
   - Simple `<textarea>` or basic code editor (e.g., CodeMirror/Monaco optional)
   - Click a pattern slot → Edit code inline
   - "Save" button applies changes to that slot
   - "Clear" button removes pattern from slot

3. **JSON Import/Export**:
   - "Export Setup" button → Download JSON file with all 40 slots
   - "Import Setup" button → Load JSON file (validates schema)
   - Format: Same as defined in data-model.md:486-508

4. **Pattern Library**:
   - Dropdown or sidebar with example patterns
   - "Load Example" → Copy pattern code to selected slot
   - Users can build their own library via export/import

**Rationale**:
- Full flexibility without waiting for Phase 2 recording
- Enables testing, sharing setups, live coding workflow
- JSON export/import supports Q1 decision (performance setup files)

---

### Q9: Web Audio Context Management ✅ RESOLVED

**Context**: Web browsers require user gesture to start AudioContext.

**Decision**: Click-to-start overlay

**Implementation Details**:

1. **Initial State**: On page load, show full-screen overlay:
   ```
   ┌─────────────────────────────────────┐
   │                                     │
   │         StrudelSynth                │
   │                                     │
   │    Click anywhere to enable audio   │
   │                                     │
   │         [Audio waveform icon]       │
   │                                     │
   └─────────────────────────────────────┘
   ```

2. **Audio Initialization Sequence**:
   ```typescript
   // On any click/touch
   overlay.addEventListener('click', async () => {
     try {
       // Initialize AudioContext
       audioContext = new AudioContext();
       await audioContext.resume();

       // Initialize Strudel
       await initStrudel(audioContext);

       // Connect MIDI devices
       await connectMIDIDevices();

       // Hide overlay, show main UI
       overlay.style.display = 'none';

     } catch (error) {
       showError("Failed to initialize audio: " + error.message);
     }
   });
   ```

3. **Buffer Size**: Use browser defaults (typically 128-256 samples)
   - Don't override unless latency testing shows issues
   - Monitor actual latency in dev tools

4. **Edge Cases**:
   - If AudioContext creation fails → Show error modal with browser compatibility info
   - If user closes/refreshes before clicking → Show overlay again
   - If audio stops responding → "Restart Audio" button in settings

**Rationale**:
- Standard web audio pattern (users expect this)
- Clear, unambiguous UX
- Ensures audio will work (no silent failures)
- Single click to get started

---

### Q10: Error Handling Strategy ✅ RESOLVED

**Context**: Spec mentions error states but doesn't define recovery strategies.

**Decisions**:
- **Code errors**: Show inline error only
- **MIDI disconnect**: Continue audio + warning banner

**Implementation Details**:

#### 1. Strudel Code Evaluation Errors

**Behavior**:
- Pattern evaluation fails (syntax error, undefined function, etc.)
- Error message displayed inline near the pattern editor
- Pattern remains in slot (preserved for debugging)
- Button LED turns red (velocity 5, per spec)
- Audio from other patterns continues unaffected

**UI Example**:
```
┌─────────────────────────────────────┐
│ Pattern Slot 5                      │
│ ─────────────────────────────────   │
│                                     │
│ note("c4 e4 g4").fasttttt(2)       │
│                                     │
│ ❌ Error: fasttttt is not defined  │
│    Did you mean: fast()?            │
│                                     │
│ [Edit] [Clear] [Try Again]          │
└─────────────────────────────────────┘
```

**Implementation**:
```typescript
async function evaluatePattern(slotIndex: number, code: string) {
  try {
    const pattern = await strudelEval(code);
    patternSlots[slotIndex].pattern = pattern;
    patternSlots[slotIndex].error = null;
    setLED(slotIndex, LED_COLORS.YELLOW);  // Loaded
  } catch (error) {
    patternSlots[slotIndex].error = error.message;
    patternSlots[slotIndex].pattern = null;
    setLED(slotIndex, LED_COLORS.RED);  // Error state
    // Show error in UI (non-blocking)
    showInlineError(slotIndex, error.message);
  }
}
```

---

#### 2. MIDI Device Disconnection

**Behavior**:
- One or both MIDI devices disconnect (USB unplugged)
- Audio playback CONTINUES (patterns keep playing)
- Warning banner appears at top of screen
- LED states lost (hardware unplugged)
- Auto-reconnect when devices plugged back in
- LED states restored after reconnect

**UI Example**:
```
┌────────────────────────────────────────────────────┐
│ ⚠️ MIDI controller disconnected. Audio continues.  │
│    Replug USB to restore hardware control.     [✕] │
└────────────────────────────────────────────────────┘
```

**Implementation**:
```typescript
midiAccess.onstatechange = (event) => {
  if (event.port.state === 'disconnected') {
    if (isAPCKeyDevice(event.port)) {
      console.warn('APCKEY25 disconnected:', event.port.name);

      // Show warning banner
      showBanner('warning', 'MIDI controller disconnected. Audio continues.');

      // Mark device as disconnected (don't stop audio)
      deviceStatus.connected = false;

      // Disable LED updates (no device to send to)
      ledUpdatesEnabled = false;
    }
  }

  if (event.port.state === 'connected') {
    if (isAPCKeyDevice(event.port)) {
      console.log('APCKEY25 reconnected:', event.port.name);

      // Reconnect device
      await reconnectDevice(event.port);

      // Restore LED states
      restoreAllLEDs();

      // Hide warning banner
      hideBanner();

      deviceStatus.connected = true;
      ledUpdatesEnabled = true;
    }
  }
};
```

---

#### 3. Audio Output Failure (Bonus - Not Asked But Important)

**Behavior**:
- AudioContext suspended or audio device disconnected
- Show non-intrusive warning indicator
- Provide "Restart Audio" button in UI
- Attempt automatic recovery once

**UI**: Small warning icon in corner + tooltip:
```
🔇 Audio output paused. Click to restart.
```

**Rationale**:
- **Code errors inline**: Non-intrusive, preserves debugging context, LED provides visual feedback
- **MIDI disconnect graceful**: Performance continues, clear warning, automatic recovery
- **Audio failure recoverable**: User can restart without reloading page

---

## Research Tasks

### RT-1: Strudel API Deep Dive 🔴 HIGH PRIORITY

**Goal**: Understand how to integrate Strudel programmatically

**Tasks**:
1. Install Strudel packages: `npm install @strudel/core @strudel/webaudio @strudel/superdough`
2. Study Strudel source code (if needed): https://github.com/tidalcycles/strudel
3. Create test file: Evaluate a simple pattern from JavaScript
4. Test pattern control: Start, stop, layer multiple patterns
5. Test parameter control: Modify parameters in real-time
6. Document API in `research/strudel-api.md`

**Success Criteria**:
- Can trigger Strudel pattern from JavaScript button click
- Can layer 2+ patterns simultaneously
- Can modify pattern parameters (e.g., speed, filter) in real-time

**Estimated Time**: 4-8 hours

---

### RT-2: APCKEY25 mk2 Protocol Documentation ✅ COMPLETE

**Goal**: Document complete MIDI protocol for mk2 variant

**Status**: ✅ **COMPLETED** on 2025-11-02

**Tasks Completed**:
1. ✅ Downloaded and configured MIDI-OX for Windows
2. ✅ Connected APCKEY25 mk2
3. ✅ Tested all 40 buttons → recorded MIDI note numbers (0-39, grid layout)
4. ✅ Tested all 8 knobs → recorded CC numbers (48-55, relative encoders)
5. ✅ Tested LED control → determined velocity-based color palette
6. ✅ Created `src/midi/devices/apckey25-mk2.json` configuration file
7. ✅ Documented findings in `specs/main/hardware/apckey25-mk2-protocol.md`
8. ✅ Created `LED-QUICK-REFERENCE.md` for implementation

**Success Criteria** (All Met):
- ✅ Complete button→note mapping (40 buttons: rows 0-4, notes 0-39)
- ✅ Complete knob→CC mapping (8 knobs on CC 48-55, relative encoders)
- ✅ LED control protocol documented (velocity-based, Note On messages)
- ✅ JSON device config file created and populated
- ✅ Core color palette identified: Red(5), Yellow(96), Green(13)

**Key Findings**:
- Button grid: Sequential notes per row (row 4 = 0-7, row 3 = 8-15, etc.)
- LED control: Send Note On to output port, velocity = color code
- LED colors: Wide palette (0-127), no RGB, solid only (no native blink)
- Knobs: All modes use same CC 48-55, relative encoders (+/- values)
- Keyboard: MIDI notes 48-72 (C2 to C4), velocity sensitive
- Special buttons: Comprehensive set (Shift=98, mode switches, navigation)

**Time Taken**: ~2 hours

**Files Created**:
- `specs/main/hardware/apckey25-mk2-protocol.md`
- `src/midi/devices/apckey25-mk2.json`
- `specs/main/hardware/LED-QUICK-REFERENCE.md`
- `specs/main/hardware/DUAL-DEVICE-ARCHITECTURE.md`

**🚨 CRITICAL DISCOVERY**: APCKEY25 mk2 uses **dual MIDI device architecture**:
- Device 1: "APC Key 25 mk2" - Keyboard only (input)
- Device 2: "MIDIIN2"/"MIDIOUT2" - Buttons, knobs, LEDs (input/output)

**Implementation Impact**:
- Must connect to BOTH devices simultaneously
- LED commands MUST go to "MIDIOUT2" (not the keyboard device)
- Different event handlers for keyboard vs. buttons/knobs
- See `DUAL-DEVICE-ARCHITECTURE.md` for complete implementation guide

---

### RT-3: Web MIDI API Testing 🟡 MEDIUM PRIORITY

**Goal**: Validate Web MIDI API support and limitations

**Tasks**:
1. Test Web MIDI API in Chrome (supported)
2. Measure MIDI input latency (target: <10ms)
3. Test hot-plug behavior (connect/disconnect during runtime)
4. Test SharedArrayBuffer availability (required for ringbuf.js)
5. Document browser compatibility

**Success Criteria**:
- MIDI input working in Chrome/Edge/Opera
- Latency measurement < 10ms
- Hot-plug detection working
- SharedArrayBuffer available with correct headers

**Estimated Time**: 2-3 hours

---

## Decisions Made

### D1: Project Structure ✅

**Decision**: Use Svelte + Vite + TypeScript

**Rationale**:
- Svelte: Reactive UI framework, minimal boilerplate
- Vite: Fast dev server, optimized builds
- TypeScript: Type safety for complex MIDI/audio logic

**Already specified in**: quickstart.md:50

---

### D2: State Management ✅

**Decision**: Use Svelte stores + IndexedDB

**Rationale**:
- Svelte stores for reactive in-memory state
- IndexedDB for persistence (patterns, recordings, settings)
- No need for Redux/MobX (Svelte stores sufficient)

**Already specified in**: data-model.md:440-481

---

### D3: Testing Approach for Phase 1 ✅

**Decision**: Manual testing with hardware (per user preference)

**Rationale**:
- User has APCKEY25 mk2 available
- Faster iteration for MVP
- TDD can be introduced in Phase 2+

**Note**: This deviates from constitution's TDD principle but is practical for hardware-dependent MVP.

---

### D4: Phase 1 Pattern Management ✅

**Decision**: Text editor + JSON import/export

**Details**: See Q8 above for full implementation details

**Rationale**: Maximum flexibility for Phase 1 MVP without waiting for Phase 2 recording

---

### D5: Audio Context Initialization ✅

**Decision**: Click-to-start overlay

**Details**: See Q9 above for implementation details

**Rationale**: Standard web audio pattern, clear UX, ensures audio works

---

### D6: Error Handling ✅

**Decisions**:
- Code evaluation errors: Inline display only
- MIDI disconnect: Continue audio + warning banner

**Details**: See Q10 above for full implementation details

**Rationale**: Non-intrusive, preserves performance flow, clear user feedback

---

## Next Steps

1. ✅ ~~Complete Research Task RT-2 (APCKEY25 mk2 Protocol)~~ - **DONE**
2. ✅ ~~Make Decisions on Q8, Q9, Q10~~ - **DONE**
3. **Complete Research Task RT-1** (Strudel API Integration) - **IN PROGRESS**
4. **Update spec.md** with clarified decisions (optional - can defer)
5. **Create implementation plan** in `plan.md` using `/speckit.plan`

**Current Status**: Ready to proceed with Strudel API research OR create implementation plan

---

**Status Legend**:
- 🔴 HIGH PRIORITY - Blocker for implementation
- 🟡 MEDIUM PRIORITY - Needed before Phase 1 complete
- 🟢 LOW PRIORITY - Can defer to later phases
- ✅ RESOLVED - Decision made, documented
