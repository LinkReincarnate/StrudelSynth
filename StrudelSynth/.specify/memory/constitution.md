# StrudelSynth Constitution

## Core Principles

### I. Modular Architecture
Every feature is built as an independent, composable module. Modules must be:
- Self-contained with clear boundaries
- Independently testable without external dependencies
- Documented with usage examples
- Designed for real-time performance constraints

### II. MIDI-First Integration
Hardware control is a first-class citizen, not an afterthought:
- MIDI input/output must be non-blocking and real-time safe
- Support hot-plugging of MIDI devices
- Provide clear mapping between hardware controls and synthesis parameters
- Device-agnostic design with APCKEY25 as reference implementation

### III. Real-Time Performance (NON-NEGOTIABLE)
Audio and MIDI processing must meet real-time constraints:
- No blocking operations in audio/MIDI threads
- Memory allocation avoided in hot paths
- Latency targets: <10ms for MIDI, <5ms for audio buffer processing
- Performance testing required for all time-critical code paths

### IV. Live Coding Compatibility
Maintain compatibility with Strudel's pattern language and workflow:
- Support dynamic code evaluation without audio dropouts
- Preserve Strudel's expressive pattern syntax
- Enable live modification of running patterns
- Provide clear error messages without disrupting audio

### V. Test-Driven Development
Testing ensures reliability in live performance contexts:
- Unit tests for all synthesis and pattern logic
- Integration tests for MIDI → Pattern → Audio pipeline
- Performance benchmarks for real-time critical paths
- Mock MIDI devices for automated testing

## Development Workflow

### Code Quality Gates
- All PRs must pass automated tests
- No commits directly to main branch
- Real-time performance benchmarks must not regress
- Breaking changes require migration guide

### Documentation Requirements
- API documentation for all public modules
- MIDI mapping documentation with diagrams
- Performance characteristics documented
- Quick-start guide for musicians (non-developers)

## Technical Standards

### Audio Processing
- Support standard sample rates (44.1kHz, 48kHz)
- Configurable buffer sizes for latency/stability trade-off
- Clear audio routing and mixing architecture
- No audio glitches during live code evaluation

### MIDI Integration
- Support MIDI Learn for flexible hardware mapping
- Handle MIDI clock and transport messages
- Provide visual feedback for MIDI activity
- Graceful degradation when hardware disconnected

### Error Handling
- Non-fatal errors never crash audio engine
- Clear distinction between compile-time and runtime errors
- Error messages visible to performer without stopping playback
- Automatic recovery from transient failures

## Governance

This constitution defines the technical philosophy and non-negotiable requirements for StrudelSynth. Changes require:
- Documentation of rationale
- Impact assessment on real-time performance
- Approval from project maintainers
- Migration guide for breaking changes

**Priority**: Live performance reliability > Feature completeness > Developer convenience

**Version**: 1.0.0 | **Ratified**: 2025-11-02 | **Last Amended**: 2025-11-02
