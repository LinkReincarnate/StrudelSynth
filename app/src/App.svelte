<script lang="ts">
  import { onMount } from 'svelte';
  import PatternGrid from './lib/components/PatternGrid.svelte';
  import StatusBar from './lib/components/StatusBar.svelte';
  import PatternInfo from './lib/components/PatternInfo.svelte';
  import PatternEditor from './lib/components/PatternEditor.svelte';
  import KnobControls from './lib/components/KnobControls.svelte';
  import { PatternEngine } from './pattern/PatternEngine';
  import { MIDIManager } from './midi/MIDIManager';
  import { RecordingManager } from './recording/RecordingManager';
  import type { PatternSlot } from './lib/types';
  import type { KnobParameter } from './lib/parameters';
  import { LED_COLORS, SPECIAL_BUTTONS, ALL_BUTTON_NOTES } from './lib/constants';
  import { savePattern, loadCustomPatterns } from './lib/storage';
  import type { RecordingState } from './lib/types';

  // State
  let patternEngine: PatternEngine;
  let midiManager: MIDIManager;
  let recordingManager: RecordingManager;
  let patterns: PatternSlot[] = [];
  let selectedPattern: PatternSlot | null = null;
  let playingPatterns: PatternSlot[] = [];
  let midiConnected = false;
  let strudelReady = false;
  let initializing = false;
  let initialized = false;

  // Editor state
  let editorVisible = false;
  let editingPattern: PatternSlot | null = null;

  // Parameter control state
  let parameters: KnobParameter[] = [];

  // Recording state
  let recordingState: RecordingState = 'idle';
  let recordingTargetSlot: number | null = null;

  // Reactive playingCount
  $: playingCount = playingPatterns.length;

  onMount(() => {
    // Initialize engines
    patternEngine = new PatternEngine();
    midiManager = new MIDIManager();
    recordingManager = new RecordingManager();

    // Load custom patterns from localStorage
    const customPatterns = loadCustomPatterns();
    customPatterns.forEach(pattern => {
      try {
        patternEngine.updatePatternCode(pattern.id, pattern.code);
        const slot = patternEngine.getSlot(pattern.id);
        if (slot) {
          slot.name = pattern.name;
          slot.category = pattern.category;
          slot.ledColor = pattern.ledColor;
        }
      } catch (error) {
        console.error(`Failed to load custom pattern ${pattern.id}:`, error);
      }
    });

    // Load initial patterns
    patterns = patternEngine.getAllSlots();
    parameters = patternEngine.getParameters();

    // Listen for pattern state changes
    patternEngine.onStateChange((slot) => {
      // Update patterns array
      patterns = patternEngine.getAllSlots();
      playingPatterns = patternEngine.getPlayingSlots();

      // Update selected pattern if it changed
      if (selectedPattern && selectedPattern.id === slot.id) {
        selectedPattern = slot;
      }
    });

    // Listen for MIDI button presses
    midiManager.onButton((event) => {
      if (event.velocity > 0 && initialized) {
        // Check if RECORD button
        if (event.note === SPECIAL_BUTTONS.RECORD) {
          handleRecordButton();
        } else if (ALL_BUTTON_NOTES.includes(event.note as any)) {
          // Regular grid button (0-39) - toggle pattern
          handlePatternToggle(event.note);
        }
      }
    });

    // Listen for MIDI knob changes
    midiManager.onKnob((event) => {
      if (initialized) {
        // Update parameter based on knob index and delta
        patternEngine.updateParameter(event.index, event.delta);
        // Update UI
        parameters = patternEngine.getParameters();
      }
    });

    // Listen for keyboard notes (25-key keyboard)
    midiManager.onKeyboardNote((event) => {
      if (initialized) {
        recordingManager.handleKeyboardNote(event);
      }
    });

    // Listen for recording state changes
    recordingManager.onStateChange((state, recording) => {
      recordingState = state;

      // Update LED for target slot
      if (recording && recording.targetSlot !== null) {
        recordingTargetSlot = recording.targetSlot;

        // Set LED based on recording state
        if (state === 'armed') {
          midiManager.setLED(recording.targetSlot, LED_COLORS.YELLOW);
        } else if (state === 'recording') {
          midiManager.setLED(recording.targetSlot, LED_COLORS.RED);
        } else if (state === 'stopped') {
          // Recording complete - generate code and save
          handleRecordingComplete(recording);
        }
      } else {
        recordingTargetSlot = null;
      }
    });

    console.log('✅ StrudelSynth initialized');
  });

  async function handleInitialize() {
    initializing = true;

    try {
      // Initialize MIDI
      await midiManager.connect();
      midiConnected = true;
      console.log('✅ MIDI connected');

      // Clear all LEDs
      midiManager.clearLEDs();

      // Initialize Strudel
      await patternEngine.initialize();
      strudelReady = true;
      console.log('✅ Strudel initialized');

      initialized = true;
      console.log('🎉 System ready!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      alert(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      initializing = false;
    }
  }

  function handlePatternToggle(slotId: number) {
    if (!initialized) {
      alert('Please initialize the system first!');
      return;
    }

    // Always select the pattern first (so you can edit it even if it fails)
    selectedPattern = patternEngine.getSlot(slotId) || null;

    // Set this slot as selected for parameter control
    patternEngine.selectSlot(slotId);

    // Update parameter display
    parameters = patternEngine.getParameters();

    try {
      const slot = patterns.find(p => p.id === slotId);
      if (!slot) return;

      // Toggle pattern
      patternEngine.togglePattern(slotId);

      // Update patterns and playingPatterns state
      patterns = patternEngine.getAllSlots();
      playingPatterns = patternEngine.getPlayingSlots();

      // Update LED
      const ledColor = patternEngine.getLEDColor(slotId);
      midiManager.setLED(slotId, ledColor);

      console.log(`Pattern ${slotId} ${slot.isPlaying ? 'started' : 'stopped'}`);
    } catch (error) {
      console.error(`Failed to toggle pattern ${slotId}:`, error);
      // Pattern is already selected, so user can click Edit to fix it
      alert(`Pattern ${slotId} failed to play. Click Edit to fix the code.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleStopAll() {
    if (!initialized) return;

    try {
      // Stop all patterns
      patternEngine.stopAll();

      // Clear all LEDs
      midiManager.clearLEDs();

      // Update state
      patterns = patternEngine.getAllSlots();
      playingPatterns = [];
      selectedPattern = null;

      console.log('✅ All patterns stopped');
    } catch (error) {
      console.error('Failed to stop all patterns:', error);
    }
  }

  function handlePatternClick(slotId: number) {
    handlePatternToggle(slotId);
  }

  function handleEditPattern(slotId: number) {
    const pattern = patternEngine.getSlot(slotId);
    if (pattern) {
      editingPattern = pattern;
      editorVisible = true;
    }
  }

  function handleSavePattern(updatedPattern: PatternSlot) {
    try {
      // Stop the pattern if it's currently playing
      const wasPlaying = patternEngine.isPlaying(updatedPattern.id);
      if (wasPlaying) {
        patternEngine.stopPattern(updatedPattern.id);
        midiManager.setLED(updatedPattern.id, LED_COLORS.OFF);
      }

      // Update pattern in engine
      patternEngine.updatePatternCode(updatedPattern.id, updatedPattern.code);

      // Update pattern metadata
      const slot = patternEngine.getSlot(updatedPattern.id);
      if (slot) {
        slot.name = updatedPattern.name;
        slot.category = updatedPattern.category;
        slot.ledColor = updatedPattern.ledColor;
      }

      // Save to localStorage
      savePattern(updatedPattern);

      // Update state
      patterns = patternEngine.getAllSlots();
      selectedPattern = patternEngine.getSlot(updatedPattern.id);

      // Restart if it was playing
      if (wasPlaying) {
        patternEngine.startPattern(updatedPattern.id);
        midiManager.setLED(updatedPattern.id, updatedPattern.ledColor);
      }

      // Close editor
      editorVisible = false;
      editingPattern = null;

      console.log(`✅ Saved pattern ${updatedPattern.id}: ${updatedPattern.name}`);
    } catch (error) {
      console.error('Failed to save pattern:', error);
      alert(`Failed to save pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleTestPattern(code: string) {
    if (!initialized || !strudelReady) {
      throw new Error('Strudel not initialized');
    }

    try {
      // Try to evaluate the pattern
      const fn = new Function(`
        with (window) {
          return ${code};
        }
      `);

      const pattern = fn();

      if (!pattern || typeof pattern.play !== 'function') {
        throw new Error('Code did not return a valid Pattern object');
      }

      console.log('✅ Pattern code is valid');
    } catch (error) {
      throw new Error(`Pattern validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleCancelEdit() {
    editorVisible = false;
    editingPattern = null;
  }

  /**
   * Handle RECORD button press
   * Toggles recording state: idle -> armed -> recording -> stopped -> idle
   */
  function handleRecordButton() {
    const state = recordingManager.getState();

    if (state === 'idle' || state === 'stopped') {
      // Start new recording - arm it for the selected slot
      if (!selectedPattern) {
        alert('Please select a pattern slot first (click a grid button)');
        return;
      }

      recordingManager.armRecording(selectedPattern.id);
      console.log(`🎙️ Recording armed for slot ${selectedPattern.id} - play notes to start recording`);
    } else if (state === 'armed' || state === 'recording') {
      // Stop recording
      const recording = recordingManager.stopRecording();
      if (!recording) {
        console.log('No recording to stop');
      }
    }
  }

  /**
   * Handle recording completion
   * Generate Strudel code and save to target slot
   */
  function handleRecordingComplete(recording: import('./lib/types').Recording) {
    if (!recording || recording.notes.length === 0) {
      console.warn('Recording is empty - no notes recorded');
      recordingManager.clearRecording();
      return;
    }

    try {
      // Generate Strudel code
      const code = recordingManager.generateStrudelCode(recording);

      // Get target slot
      const slot = patternEngine.getSlot(recording.targetSlot!);
      if (!slot) {
        throw new Error(`Target slot ${recording.targetSlot} not found`);
      }

      // Update pattern
      patternEngine.updatePatternCode(recording.targetSlot!, code);
      slot.name = `Recorded ${new Date().toLocaleTimeString()}`;
      slot.category = 'recorded';

      // Save to localStorage
      savePattern({
        id: slot.id,
        code: slot.code,
        name: slot.name,
        category: slot.category!,
        ledColor: slot.ledColor,
      });

      // Update UI
      patterns = patternEngine.getAllSlots();
      selectedPattern = slot;

      // Set LED to green (loaded and ready)
      midiManager.setLED(recording.targetSlot!, LED_COLORS.GREEN);

      // Clear recording
      recordingManager.clearRecording();

      console.log(`✅ Recording saved to slot ${recording.targetSlot}: ${slot.name}`);
      console.log(`📝 Generated code: ${code}`);
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert(`Failed to save recording: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Clear LED on error
      if (recording.targetSlot !== null) {
        midiManager.setLED(recording.targetSlot, LED_COLORS.OFF);
      }

      recordingManager.clearRecording();
    }
  }
</script>

<!-- Audio Context Unlock Overlay -->
{#if !initialized}
  <div class="audio-overlay" on:click={() => handleInitialize()}>
    <div class="overlay-content">
      <h1>🎵 StrudelSynth</h1>
      <p>APCKEY25 mk2 Live Coding Interface</p>
      <p class="hint">Click anywhere to start</p>
    </div>
  </div>
{/if}

<main>
  <header>
    <h1>🎵 StrudelSynth</h1>
    <p class="subtitle">APCKEY25 mk2 Pattern Controller</p>
  </header>

  <StatusBar
    {midiConnected}
    {strudelReady}
    {playingCount}
    {initializing}
    onInitialize={handleInitialize}
    onStopAll={handleStopAll}
  />

  <div class="knobs-section">
    <KnobControls {parameters} />
  </div>

  <!-- Recording Status Indicator -->
  {#if recordingState !== 'idle'}
    <div class="recording-status" class:armed={recordingState === 'armed'} class:recording={recordingState === 'recording'}>
      {#if recordingState === 'armed'}
        <span class="status-icon">⏺️</span>
        <span class="status-text">Recording Armed - Slot {recordingTargetSlot} - Play notes to start</span>
      {:else if recordingState === 'recording'}
        <span class="status-icon pulse">🔴</span>
        <span class="status-text">Recording in Progress - Slot {recordingTargetSlot}</span>
      {/if}
    </div>
  {/if}

  <div class="content">
    <div class="grid-section">
      <h2>Pattern Grid</h2>
      <PatternGrid
        {patterns}
        onPatternClick={handlePatternClick}
        onPatternEdit={handleEditPattern}
      />
    </div>

    <div class="info-section">
      <PatternInfo
        {selectedPattern}
        {playingPatterns}
        onEdit={handleEditPattern}
      />
    </div>
  </div>

  <footer>
    <p>Press buttons on your APCKEY25 or click the grid to play patterns • Turn knobs to adjust parameters • Press RECORD to capture keyboard melodies</p>
    <p class="version">Phase 2.3 - Recording & Transcription</p>
  </footer>
</main>

<!-- Pattern Editor Modal -->
<PatternEditor
  pattern={editingPattern}
  visible={editorVisible}
  onSave={handleSavePattern}
  onTest={handleTestPattern}
  onCancel={handleCancelEdit}
/>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #000;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .audio-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
  }

  .overlay-content {
    text-align: center;
    padding: 40px;
  }

  .overlay-content h1 {
    font-size: 48px;
    margin-bottom: 20px;
    color: #4caf50;
  }

  .overlay-content p {
    font-size: 20px;
    color: #888;
    margin: 10px 0;
  }

  .hint {
    font-size: 16px !important;
    color: #666 !important;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    text-align: center;
    padding: 30px 20px 20px;
    background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
  }

  header h1 {
    margin: 0;
    font-size: 36px;
    color: #4caf50;
  }

  .subtitle {
    margin: 10px 0 0;
    font-size: 16px;
    color: #888;
  }

  .knobs-section {
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px;
    width: 100%;
  }

  .content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 20px;
    padding: 20px;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
  }

  .grid-section h2 {
    margin: 0 0 15px 0;
    font-size: 20px;
    color: #4caf50;
    padding: 0 20px;
  }

  .info-section {
    display: flex;
    flex-direction: column;
  }

  .recording-status {
    max-width: 1600px;
    margin: 0 auto 20px;
    padding: 15px 20px;
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
  }

  .recording-status.armed {
    border-color: #ffa500;
    background: rgba(255, 165, 0, 0.1);
  }

  .recording-status.recording {
    border-color: #ff0000;
    background: rgba(255, 0, 0, 0.1);
  }

  .status-icon {
    font-size: 20px;
  }

  .status-icon.pulse {
    animation: pulse-red 1s infinite;
  }

  @keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    color: #fff;
    font-weight: 600;
  }

  footer {
    text-align: center;
    padding: 20px;
    background: #0a0a0a;
    border-top: 2px solid #333;
    color: #666;
    font-size: 14px;
  }

  footer p {
    margin: 5px 0;
  }

  .version {
    font-size: 12px;
    color: #444;
  }

  @media (max-width: 1024px) {
    .content {
      grid-template-columns: 1fr;
    }

    .info-section {
      order: -1;
    }
  }

  @media (max-width: 768px) {
    header h1 {
      font-size: 28px;
    }

    .subtitle {
      font-size: 14px;
    }

    .content {
      padding: 10px;
      gap: 10px;
    }
  }
</style>
