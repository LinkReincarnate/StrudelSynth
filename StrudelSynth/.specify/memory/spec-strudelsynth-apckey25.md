# Feature Specification: StrudelSynth APCKEY25 Integration

**Feature Branch**: `001-apckey25-integration`
**Created**: 2025-11-02
**Status**: Draft
**Input**: Build an application that combines the use of a midi controller with strudel synth. Key features are pattern triggering with buttons, slider control with knobs, realtime play of notes on the keyboard to record patterns. Autotranscription of notes played on the keyboard into strudel code. Realtime visualizers that extend strudel visualizers and use the led buttons of the APCKey25.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Live Pattern Triggering (Priority: P1)

As a live coder, I want to trigger pre-defined Strudel patterns using the APCKEY25's button grid so that I can perform live music without typing code during performance.

**Why this priority**: This is the core performance feature that enables hands-free live performance. Without this, the controller is not usable for live situations.

**Independent Test**: Can be fully tested by loading 8 patterns, pressing grid buttons, and verifying audio playback without any other features active.

**Acceptance Scenarios**:

1. **Given** 8 Strudel patterns are loaded into pattern slots, **When** I press a button in the 5x8 grid, **Then** the corresponding pattern starts playing and the button LED turns green
2. **Given** a pattern is currently playing (LED green), **When** I press the same button again, **Then** the pattern stops and the LED turns off
3. **Given** multiple patterns are loaded, **When** I press multiple buttons, **Then** all selected patterns play simultaneously (layered)
4. **Given** a pattern slot has a pattern loaded but not playing, **When** I view the controller, **Then** the button LED shows amber
5. **Given** I am recording a new pattern, **When** I assign it to a button slot, **Then** the button LED turns red during recording

---

### User Story 2 - Real-time Parameter Control (Priority: P1)

As a performer, I want to control synthesis parameters using the 8 knobs so that I can add expression and variation during live performance.

**Why this priority**: Essential for expressive performance - static patterns without parameter control would be musically limited.

**Independent Test**: Load a single pattern, rotate knobs, and verify audio parameters change in real-time without code editing.

**Acceptance Scenarios**:

1. **Given** a pattern is playing, **When** I rotate knob 1, **Then** the volume of the pattern changes smoothly without audio glitches
2. **Given** a pattern with filter parameters, **When** I rotate knob 2, **Then** the filter cutoff frequency changes in real-time
3. **Given** multiple patterns are playing, **When** I rotate a knob, **Then** the parameter affects all active patterns proportionally
4. **Given** I am in "Device Mode", **When** I rotate knobs 1-8, **Then** they control the first 8 Strudel pattern parameters (e.g., speed, cutoff, resonance, delay, reverb, distortion, pan, gain)
5. **Given** knob assignments are customized, **When** I save the configuration, **Then** the mappings persist across sessions

---

### User Story 3 - Keyboard Note Recording (Priority: P2)

As a musician, I want to play notes on the APCKEY25's 25-key keyboard and record them as Strudel patterns so that I can create music using my keyboard skills rather than only coding.

**Why this priority**: Bridges traditional musicianship with live coding, makes the system accessible to keyboard players.

**Independent Test**: Press keys, activate recording, play a melody, stop recording, and verify the pattern plays back correctly.

**Acceptance Scenarios**:

1. **Given** I press the "Record" button, **When** I play notes on the keyboard, **Then** MIDI note data is captured with timing information
2. **Given** I have recorded a sequence of notes, **When** I stop recording, **Then** the pattern loops automatically at the detected tempo
3. **Given** I am recording, **When** I press the sustain button while playing notes, **Then** note durations are extended
4. **Given** a recorded pattern exists, **When** I press "overdub" and play additional notes, **Then** new notes are added to the existing pattern
5. **Given** I have just finished recording, **When** I view the pattern, **Then** I can immediately edit the pattern parameters via knobs

---

### User Story 4 - Auto-transcription to Strudel Code (Priority: P2)

As a live coder learning Strudel, I want recorded keyboard patterns to be automatically converted to Strudel code so that I can learn the syntax and edit patterns programmatically.

**Why this priority**: Educational value and enables hybrid workflow between performance and coding. Helps users transition from hardware to code-based composition.

**Independent Test**: Record a simple melody, view the generated code, verify it produces the same audio output when evaluated.

**Acceptance Scenarios**:

1. **Given** I have recorded a pattern of notes [C4, E4, G4, C5] with quarter-note timing, **When** I request code generation, **Then** I receive valid Strudel code like `note("c4 e4 g4 c5")`
2. **Given** I recorded notes with varying velocities, **When** code is generated, **Then** velocity information is included as `.velocity("0.5 0.8 1.0 0.6")`
3. **Given** I recorded a pattern with rhythmic variation, **When** code is generated, **Then** timing is represented using Strudel's pattern notation (e.g., `"c4 [e4 g4] c5"`)
4. **Given** generated code is displayed, **When** I copy it to the Strudel editor, **Then** it evaluates without errors and plays identically
5. **Given** I have multiple recorded patterns, **When** I request full code export, **Then** I receive a complete Strudel composition with all patterns defined

---

### User Story 5 - LED Visual Feedback (Priority: P3)

As a performer, I want the APCKEY25's LED buttons to reflect pattern states and audio activity so that I have visual feedback without looking at a screen.

**Why this priority**: Enhances performance experience but system is functional without it. Nice-to-have for professional setups.

**Independent Test**: Play patterns and observe LED colors changing to reflect system state without audio dependency.

**Acceptance Scenarios**:

1. **Given** a pattern is loaded but not playing, **When** I view the controller, **Then** the button shows amber LED
2. **Given** a pattern is actively playing, **When** audio is output, **Then** the button shows green LED
3. **Given** I am recording a new pattern, **When** recording is active, **Then** the target button shows red LED
4. **Given** a pattern is empty/unassigned, **When** I view the controller, **Then** the button LED is off
5. **Given** an error occurs (e.g., pattern evaluation failed), **When** the error state is active, **Then** the button blinks red

---

### User Story 6 - Audio-Reactive LED Visualizer (Priority: P3)

As a performer, I want the LED grid to visualize audio activity (volume, frequency, rhythm) so that my hardware controller becomes part of the visual performance.

**Why this priority**: Extends Strudel's existing visualizers to hardware. Adds performance value but not essential for core functionality.

**Independent Test**: Play audio and verify LED grid responds to audio characteristics independently of pattern triggering features.

**Acceptance Scenarios**:

1. **Given** audio is playing, **When** volume increases, **Then** more LEDs in a column illuminate (VU meter style)
2. **Given** a beat/kick drum plays, **When** the transient occurs, **Then** LEDs pulse in sync with the rhythm
3. **Given** I enable frequency visualization mode, **When** low frequencies play, **Then** bottom rows light up, high frequencies light up top rows
4. **Given** multiple visualization modes exist, **When** I switch modes via a dedicated button, **Then** the LED display changes visualization style
5. **Given** I disable visualization mode, **When** I return to pattern mode, **Then** LEDs return to showing pattern states (amber/green/red)

---

### Edge Cases

- **What happens when APCKEY25 is disconnected during performance?**
  - System continues playing with graceful degradation
  - On-screen message indicates controller disconnected
  - Patterns continue playing; only hardware control is lost
  - Auto-reconnect when device plugged back in

- **What happens when user plays keyboard faster than system can transcribe?**
  - Notes are buffered with timestamps
  - If buffer overflows, oldest notes are discarded with warning
  - Latency monitoring ensures <10ms MIDI input response

- **What happens when user triggers 40 patterns simultaneously?**
  - System enforces maximum polyphony limit (configurable, default: 8 concurrent patterns)
  - Oldest patterns are stopped when limit exceeded (FIFO)
  - Visual warning shown when approaching limit

- **What happens when auto-generated Strudel code is invalid?**
  - Fallback to raw MIDI data representation
  - Error message indicates which notes/timings caused issue
  - User can manually edit the generated code
  - Original MIDI recording is preserved

- **What happens when knob is rotated during audio dropout?**
  - Parameter changes are queued and applied when audio resumes
  - No sudden parameter jumps when audio recovers
  - Knob state is always synchronized with actual audio parameters

## Requirements *(mandatory)*

### Functional Requirements

#### MIDI Integration
- **FR-001**: System MUST detect and connect to APCKEY25 via Web MIDI API on startup
- **FR-002**: System MUST support hot-plugging (connect/disconnect) of APCKEY25 without crashes
- **FR-003**: System MUST respond to MIDI note input within 10ms (real-time performance constraint)
- **FR-004**: System MUST respond to MIDI CC (knob) input within 10ms
- **FR-005**: System MUST send LED control messages to APCKEY25 to update button colors
- **FR-006**: System MUST handle MIDI clock messages for tempo synchronization (optional BPM source)

#### Pattern Management
- **FR-007**: System MUST store up to 40 pattern slots (5x8 grid mapping)
- **FR-008**: System MUST allow patterns to be triggered, stopped, and layered via button presses
- **FR-009**: System MUST support simultaneous playback of up to 8 patterns (polyphony limit)
- **FR-010**: System MUST persist pattern assignments across browser sessions (localStorage/IndexedDB)
- **FR-011**: System MUST support pattern muting/soloing via dedicated buttons

#### Recording & Transcription
- **FR-012**: System MUST record MIDI note data with timestamp and velocity information
- **FR-013**: System MUST auto-detect tempo from recorded note timing
- **FR-014**: System MUST quantize recorded notes to configurable grid (1/16, 1/8, 1/4 notes)
- **FR-015**: System MUST generate valid Strudel code from recorded MIDI patterns
- **FR-016**: System MUST support overdub recording (adding notes to existing pattern)
- **FR-017**: Generated Strudel code MUST evaluate without errors in Strudel environment

#### Parameter Control
- **FR-018**: System MUST map 8 knobs to configurable Strudel pattern parameters
- **FR-019**: System MUST support multiple knob modes (Volume, Pan, Send, Device)
- **FR-020**: System MUST apply parameter changes without audio glitches (<5ms audio buffer constraint)
- **FR-021**: System MUST support MIDI Learn for custom knob mappings
- **FR-022**: System MUST display current parameter values in UI when knobs are adjusted

#### Visualization
- **FR-023**: System MUST update LED colors based on pattern state (off/amber/green/red)
- **FR-024**: System MUST support audio-reactive LED visualization modes (VU meter, beat pulse, frequency spectrum)
- **FR-025**: System MUST allow switching between pattern mode and visualizer mode
- **FR-026**: LED updates MUST be synchronized with audio to avoid visual lag
- **FR-027**: System MUST extend Strudel's existing visualizer architecture

#### Error Handling & Resilience
- **FR-028**: System MUST continue audio playback if MIDI controller disconnects
- **FR-029**: System MUST display clear error messages for invalid pattern code
- **FR-030**: System MUST recover gracefully from audio buffer underruns
- **FR-031**: System MUST validate generated Strudel code before auto-evaluation
- **FR-032**: System MUST provide fallback to MIDI data if code generation fails

### Non-Functional Requirements

#### Performance
- **NFR-001**: MIDI input latency MUST be <10ms (99th percentile)
- **NFR-002**: Audio buffer processing MUST be <5ms (real-time constraint)
- **NFR-003**: LED update rate MUST be at least 30 FPS for smooth visualization
- **NFR-004**: System MUST handle 8 simultaneous patterns without CPU >80%
- **NFR-005**: Memory allocation in audio thread MUST be zero (real-time safety)

#### Compatibility
- **NFR-006**: System MUST work in modern browsers supporting Web MIDI API (Chrome, Edge, Opera)
- **NFR-007**: System MUST integrate with existing Strudel codebase without forking
- **NFR-008**: System MUST support both APCKEY25 mk1 and mk2 hardware variants
- **NFR-009**: Generated code MUST be compatible with standalone Strudel environment

#### Usability
- **NFR-010**: Musicians with no coding experience MUST be able to perform using only hardware
- **NFR-011**: System MUST provide visual feedback for all hardware interactions
- **NFR-012**: Documentation MUST include MIDI mapping diagrams for APCKEY25
- **NFR-013**: System MUST support saving/loading complete performance setups

#### Reliability
- **NFR-014**: System uptime during live performance MUST be >99.9% (no crashes)
- **NFR-015**: Pattern state MUST persist across browser refreshes
- **NFR-016**: MIDI communication errors MUST not crash the audio engine
- **NFR-017**: System MUST auto-reconnect to MIDI device within 2 seconds of re-plug

### Key Entities

- **Pattern**: A Strudel code snippet or recorded MIDI sequence that generates audio. Attributes: code (string), slot (0-39), state (stopped/playing/recording), LED color, assigned parameters
- **MIDIController**: Represents the APCKEY25 hardware. Attributes: connection state, button map, knob map, LED state array, firmware version
- **Recording**: Captured MIDI note data. Attributes: notes array (pitch, velocity, timestamp), tempo (BPM), quantization grid, recording state
- **KnobMapping**: Associates hardware knobs with Strudel parameters. Attributes: knob ID (0-7), target parameter (string), min/max range, curve (linear/log), mode (Volume/Pan/Send/Device)
- **Visualizer**: LED visualization configuration. Attributes: mode (pattern/VU/beat/spectrum), color scheme, sensitivity, update rate

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A musician with no coding experience can load and trigger 8 patterns within 2 minutes of first use
- **SC-002**: Recorded keyboard patterns are transcribed to valid Strudel code with >95% accuracy (verified by A/B audio comparison)
- **SC-003**: MIDI-to-audio latency is imperceptible to performers (<10ms measured via audio loopback test)
- **SC-004**: System can run for 60+ minutes continuous performance without crashes or audio glitches
- **SC-005**: 90% of users can successfully customize knob mappings using MIDI Learn without reading documentation
- **SC-006**: LED visualizations are synchronized with audio within 33ms (30 FPS = acceptable visual latency)
- **SC-007**: Pattern switching causes zero audio dropouts (measured via audio analysis)
- **SC-008**: Generated Strudel code evaluates successfully in standalone Strudel REPL 100% of the time

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     StrudelSynth Application                 │
│                                                              │
│  ┌────────────────┐      ┌─────────────────────────────┐   │
│  │  Web MIDI API  │◄────►│   MIDI Controller Manager    │   │
│  │   (Browser)    │      │  - Device detection          │   │
│  └────────────────┘      │  - Input/Output routing      │   │
│                          │  - LED control               │   │
│                          └──────────┬──────────────────┘   │
│                                     │                       │
│  ┌──────────────────────────────────▼──────────────────┐   │
│  │           Pattern & Recording Engine               │   │
│  │  - Pattern slot management (40 slots)              │   │
│  │  - MIDI recording & playback                       │   │
│  │  - Quantization & tempo detection                  │   │
│  │  - Pattern layering & mixing                       │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                      │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │       Strudel Code Generator & Evaluator          │   │
│  │  - MIDI → Strudel code transcription              │   │
│  │  - Code validation                                 │   │
│  │  - Integration with Strudel pattern engine         │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                      │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │         Parameter Control Router                   │   │
│  │  - Knob CC mapping                                 │   │
│  │  - MIDI Learn functionality                        │   │
│  │  - Real-time parameter updates                     │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                      │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │            Strudel Audio Engine                    │   │
│  │  (Existing - superdough synth, effects, mixer)     │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                      │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │       Visualizer & LED Feedback System             │   │
│  │  - Audio analysis (RMS, FFT, beat detection)       │   │
│  │  - LED pattern generation                          │   │
│  │  - Mode switching (pattern/visualizer)             │   │
│  │  - Extends Strudel visualizers                     │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                      │
│                     ▼                                      │
│              ┌────────────┐                                │
│              │ Web Audio  │                                │
│              │    API     │                                │
│              └────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

#### Pattern Triggering Flow
```
APCKEY25 Button Press → MIDI Input (Note On) → Pattern Manager
→ Strudel Pattern Evaluation → Audio Engine → Speaker Output
→ LED Feedback (Green) → APCKEY25 LED Update
```

#### Recording & Transcription Flow
```
Record Button Press → Recording State Active → LED (Red)
→ Keyboard Note Presses → MIDI Note Capture with Timestamps
→ Stop Recording → Tempo Detection & Quantization
→ Strudel Code Generation → Code Validation
→ Pattern Assignment to Slot → LED (Amber) → Display Code in UI
```

#### Real-time Parameter Control Flow
```
Knob Rotation → MIDI CC Message → Parameter Router
→ Map CC to Strudel Parameter → Update Active Patterns
→ Audio Engine Parameter Change (lock-free) → Audio Output
→ UI Parameter Display Update
```

#### Visualizer Flow
```
Audio Buffer → Audio Analysis (RMS/FFT/Beat Detection)
→ Visualization Algorithm → LED Color Array Generation
→ MIDI LED Control Messages → APCKEY25 LED Update (30+ FPS)
```

## Technical Constraints & Considerations

### Real-Time Performance
Per constitution (Principle III: Real-Time Performance), all MIDI and audio processing must meet strict latency requirements:
- No blocking operations in audio callback
- Lock-free data structures for cross-thread communication
- Pre-allocated buffers (no garbage collection in hot paths)
- MIDI input processed on dedicated high-priority thread

### Strudel Integration
Per constitution (Principle IV: Live Coding Compatibility):
- Generated code must use Strudel's pattern DSL syntax
- Support dynamic pattern evaluation without audio interruption
- Maintain compatibility with Strudel's pattern operators (e.g., `.fast()`, `.slow()`, `.jux()`)
- Extend rather than fork Strudel's architecture

### MIDI Hardware Abstraction
Per constitution (Principle II: MIDI-First Integration):
- Device-agnostic design with APCKEY25 as reference
- Support for future controllers via configuration files
- MIDI Learn allows arbitrary controller mapping
- Hot-plug support required for live performance reliability

### Browser Limitations
- Web MIDI API not supported in Firefox/Safari (document workarounds)
- Audio latency higher than native apps (optimize buffer sizes)
- Clipboard access for code export may require user permission

## Open Questions & Clarifications Needed

- **Q1**: Should the system support saving/exporting complete performance setups (all 40 patterns + knob mappings) as a single file?
  - **Recommendation**: Yes - use JSON format for portability

- **Q2**: What should happen when user edits auto-generated Strudel code? Should it update the MIDI recording or become independent?
  - **Recommendation**: Becomes independent - code diverges from MIDI source

- **Q3**: Should the system support sending MIDI clock to synchronize external gear?
  - **Recommendation**: Phase 2 feature - focus on input first

- **Q4**: What quantization grids should be supported for recording? (1/4, 1/8, 1/16, 1/32, triplets?)
  - **Recommendation**: Start with 1/16 grid, make configurable later

- **Q5**: Should multiple APCKEY25 controllers be supported simultaneously?
  - **Recommendation**: Phase 2 - single controller for MVP

## Testing Strategy

### Unit Tests
- MIDI message parsing and generation
- Pattern state machine transitions
- Code generation algorithms (MIDI → Strudel)
- Parameter mapping logic
- LED color calculation

### Integration Tests
- MIDI Input → Pattern Playback → Audio Output
- Recording → Transcription → Code Evaluation
- Knob Control → Parameter Update → Audio Change
- Pattern Layering (multiple simultaneous patterns)

### Performance Tests
- MIDI input latency benchmarking (<10ms requirement)
- Audio buffer processing time (<5ms requirement)
- LED update frame rate (>30 FPS requirement)
- CPU usage under load (8 concurrent patterns)
- Memory allocation profiling (zero in audio thread)

### Manual/User Acceptance Tests
- Hardware controller connectivity and hot-plug
- Live performance scenario (60-minute session)
- MIDI Learn workflow usability
- Generated code accuracy validation (listening tests)
- LED visualization synchronization

### Mock/Stub Requirements
- Virtual MIDI device for automated testing (per constitution Principle V)
- Audio output verification (capture and analyze waveforms)
- Simulated APCKEY25 input for CI/CD pipeline

## Implementation Phases

### Phase 1: Core MIDI & Pattern Triggering (MVP)
- Web MIDI API integration
- APCKEY25 device detection and connection
- 40-slot pattern management
- Button → Pattern triggering
- Basic LED feedback (amber/green states)
- **Deliverable**: Can trigger and play pre-coded Strudel patterns via hardware

### Phase 2: Recording & Transcription
- MIDI note recording with timestamps
- Tempo detection and quantization
- MIDI → Strudel code generation
- Code validation and evaluation
- **Deliverable**: Can record keyboard performances and convert to Strudel code

### Phase 3: Parameter Control
- Knob CC mapping to Strudel parameters
- Real-time parameter updates
- MIDI Learn functionality
- Multiple knob modes (Volume/Pan/Send/Device)
- **Deliverable**: Full expressive control via hardware knobs

### Phase 4: Visualization & Polish
- Audio-reactive LED visualizer
- Multiple visualization modes
- Mode switching
- Performance optimization
- **Deliverable**: Complete hardware-integrated live coding environment

## Appendix: APCKEY25 Hardware Reference

### Button Grid
- 5 rows × 8 columns = 40 RGB LED buttons
- MIDI: Note On/Off messages
- LED Control: MIDI Note On messages with velocity = color code

### Knobs
- 8 endless rotary encoders
- MIDI: CC messages (specific CC numbers per knob)
- 4 modes selectable via mode buttons

### Keyboard
- 25 velocity-sensitive keys
- MIDI: Standard Note On/Off with velocity

### LED Color Codes (typical)
- Off: 0
- Red: 1-4 (varying intensity)
- Amber: 5-8
- Yellow: 9-12
- Green: 13-16
- (RGB values vary by mk1 vs mk2)

---

**Next Steps**:
1. Validate this specification with stakeholders
2. Clarify open questions (Q1-Q5)
3. Create implementation plan using `/speckit.plan`
4. Begin Phase 1 development with TDD approach per constitution
