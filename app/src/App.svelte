<script lang="ts">
  import { onMount } from 'svelte';
  import PatternGrid from './lib/components/PatternGrid.svelte';
  import StatusBar from './lib/components/StatusBar.svelte';
  import PatternInfo from './lib/components/PatternInfo.svelte';
  import PatternEditor from './lib/components/PatternEditor.svelte';
  import KnobControls from './lib/components/KnobControls.svelte';
  import LiveCodeEditor from './lib/components/LiveCodeEditor.svelte';
  import { PatternEngine } from './pattern/PatternEngine';
  import { MIDIManager } from './midi/MIDIManager';
  import { RecordingManager } from './recording/RecordingManager';
  import { KeyboardPreview } from './lib/KeyboardPreview';
  import type { PatternSlot } from './lib/types';
  import { LED_COLORS, SPECIAL_BUTTONS, ALL_BUTTON_NOTES } from './lib/constants';
  import { savePattern, loadCustomPatterns } from './lib/storage';
  import type { RecordingState } from './lib/types';

  // State
  let patternEngine: PatternEngine;
  let midiManager: MIDIManager;
  let recordingManager: RecordingManager;
  let keyboardPreview: KeyboardPreview;
  let patterns: PatternSlot[] = [];
  let selectedPattern: PatternSlot | null = null;
  let playingPatterns: PatternSlot[] = [];
  let midiConnected = false;
  let strudelReady = false;
  let initializing = false;
  let initialized = false;

  // Keyboard preview state
  let previewEnabled = true; // Enable by default
  let selectedSynth = 'sampler_piano'; // Default to sampler piano
  let previousSynth = 'sampler_piano'; // Track previous synth for reverting
  let customSampleLoaded = false;
  let customSampleName = '';
  let fileInputElement: HTMLInputElement;

  // Available synths for dropdown (organized by category)
  const availableSynths = [
    // Custom Sample
    { value: 'custom_sample', label: '📁 Custom Sample...' },
    // Sampler Instruments (pitch-shifted audio samples)
    { value: 'sampler_piano', label: '🎹 Sampler Piano' },
    { value: 'sampler_epiano', label: '🎹 Sampler Electric Piano' },
    { value: 'sampler_guitar', label: '🎸 Sampler Guitar' },
    { value: 'sampler_bass', label: '🎸 Sampler Bass' },
    // Wavetable Synths (additive/harmonic)
    { value: 'wt_organ', label: '🎛️ Wavetable Organ' },
    { value: 'wt_bell', label: '🔔 Wavetable Bell' },
    { value: 'wt_strings', label: '🎻 Wavetable Strings' },
    { value: 'wt_brass', label: '🎺 Wavetable Brass' },
    { value: 'wt_lead', label: '⚡ Wavetable Lead' },
    { value: 'wt_pad', label: '🌊 Wavetable Pad' },
    // Synthesized Instruments (filtered oscillators)
    { value: 'casio', label: '🎛️ Casio (Synth)' },
    { value: 'gtr', label: '🎛️ Guitar (Synth)' },
    { value: 'arpy', label: '🎛️ Arpy (Bright)' },
    { value: 'bass', label: '🎛️ Bass (Deep)' },
    // Basic Waveforms
    { value: 'sine', label: '〰️ Sine Wave' },
    { value: 'triangle', label: '△ Triangle Wave' },
    { value: 'sawtooth', label: '⚡ Sawtooth Wave' },
    { value: 'square', label: '▢ Square Wave' },
  ];

  // Editor state
  let editorVisible = false;
  let editingPattern: PatternSlot | null = null;

  // Parameter control state (now handled by dynamic parameters in KnobControls)
  let parameterRefreshCounter = 0; // Increment to force KnobControls to refresh

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
    keyboardPreview = new KeyboardPreview();

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
        // Force KnobControls to refresh by incrementing counter
        parameterRefreshCounter++;
      }
    });

    // Listen for keyboard notes (25-key keyboard)
    midiManager.onKeyboardNote((event) => {
      if (initialized) {
        // Play preview sound (if enabled)
        if (previewEnabled) {
          keyboardPreview.playNote(event);
        }

        // Handle recording
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

      // Initialize keyboard preview
      await keyboardPreview.initialize();
      console.log('✅ Keyboard preview initialized');

      // Set initial synth to match dropdown selection
      keyboardPreview.setSynth(selectedSynth);

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

    // Detect and initialize parameters for this slot if not already done
    if (selectedPattern && !selectedPattern.dynamicParameters) {
      patternEngine.detectAndInitializeParameters(slotId);
      // Refresh selected pattern to show detected parameters
      selectedPattern = patternEngine.getSlot(slotId) || null;
    }

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

  /**
   * Handle live code evaluation (from LiveCodeEditor)
   */
  function handleLiveEvaluate(slotId: number, code: string) {
    if (!initialized) return;

    try {
      // Use the new updateLiveCode method for seamless updates
      patternEngine.updateLiveCode(slotId, code);

      // Update UI state
      patterns = patternEngine.getAllSlots();
      playingPatterns = patternEngine.getPlayingSlots();

      console.log(`✅ Live code evaluated for slot ${slotId}`);
    } catch (error) {
      console.error(`Failed to evaluate live code for slot ${slotId}:`, error);
      throw error; // Re-throw so LiveCodeEditor can display the error
    }
  }

  /**
   * Handle stop from LiveCodeEditor
   */
  function handleLiveStop(slotId: number) {
    if (!initialized) return;

    try {
      patternEngine.stopPattern(slotId);
      midiManager.setLED(slotId, LED_COLORS.OFF);

      // Update UI state
      patterns = patternEngine.getAllSlots();
      playingPatterns = patternEngine.getPlayingSlots();

      console.log(`✅ Stopped pattern ${slotId} from live editor`);
    } catch (error) {
      console.error(`Failed to stop pattern ${slotId}:`, error);
    }
  }

  /**
   * Handle synth selection change
   */
  function handleSynthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;

    // If user selected custom_sample, always open file picker (even if already loaded)
    if (newValue === 'custom_sample') {
      // If already on custom_sample and clicking again, open file picker to load new sample
      if (selectedSynth === 'custom_sample' && customSampleLoaded) {
        // Already on custom sample, just open picker to replace
        fileInputElement?.click();
        return;
      }

      // Store current synth to revert if user cancels
      previousSynth = selectedSynth === 'custom_sample' ? previousSynth : selectedSynth;
      // Open file picker (but don't change the synth yet)
      fileInputElement?.click();
      // Revert dropdown immediately - it will update again if sample loads
      selectedSynth = previousSynth;
      return;
    }

    // Normal synth change
    previousSynth = selectedSynth;
    selectedSynth = newValue;

    if (initialized) {
      keyboardPreview.setSynth(selectedSynth);
      console.log(`🎹 Keyboard synth changed to: ${selectedSynth}`);
    }
  }

  /**
   * Handle custom sample file selection
   */
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      // User cancelled - dropdown already reverted in handleSynthChange
      return;
    }

    // Check file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      // Dropdown already shows previousSynth, no need to change
      return;
    }

    try {
      console.log(`📁 Loading custom sample: ${file.name}`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Decode and load using KeyboardPreview's own AudioContext
      if (!keyboardPreview || !initialized) {
        throw new Error('Audio system not initialized');
      }

      // Load the sample into keyboard preview (decodes using correct AudioContext)
      await keyboardPreview.loadCustomSampleFromArrayBuffer(arrayBuffer, 60); // Default to C4

      // Update state - NOW we can switch to custom_sample
      customSampleLoaded = true;
      customSampleName = file.name;
      selectedSynth = 'custom_sample';

      // Set the synth in keyboard preview
      keyboardPreview.setSynth('custom_sample');

      console.log(`✅ Custom sample loaded: ${file.name}`);
    } catch (error) {
      console.error('Failed to load custom sample:', error);
      alert(`Failed to load custom sample: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't change selectedSynth - it's already at previousSynth
      customSampleLoaded = false;
      customSampleName = '';
    } finally {
      // Clear file input
      input.value = '';
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

  <!-- Keyboard Preview Toggle -->
  {#if initialized}
    <div class="keyboard-preview-controls">
      <label class="toggle-label">
        <input type="checkbox" bind:checked={previewEnabled} />
        <span class="toggle-switch"></span>
        <span class="toggle-text">🎹 Keyboard Preview</span>
      </label>

      <div class="synth-selector">
        <label for="synth-select" class="synth-label">Synth:</label>
        <select id="synth-select" bind:value={selectedSynth} on:change={handleSynthChange} class="synth-dropdown">
          {#each availableSynths as synth}
            {#if synth.value === 'custom_sample' && customSampleLoaded}
              <option value={synth.value}>📁 {customSampleName}</option>
            {:else}
              <option value={synth.value}>{synth.label}</option>
            {/if}
          {/each}
        </select>

        <!-- Hidden file input for custom sample loading -->
        <input
          type="file"
          bind:this={fileInputElement}
          on:change={handleFileSelect}
          accept="audio/*"
          style="display: none;"
        />
      </div>
    </div>
  {/if}

  <div class="knobs-section">
    <KnobControls
      patternEngine={initialized ? patternEngine : null}
      selectedSlotId={selectedPattern?.id ?? null}
      refreshCounter={parameterRefreshCounter}
      on:refresh={() => parameterRefreshCounter++}
    />
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
    <div class="left-column">
      <div class="grid-section">
        <h2>Pattern Grid</h2>
        <PatternGrid
          {patterns}
          onPatternClick={handlePatternClick}
          onPatternEdit={handleEditPattern}
        />
      </div>

      <div class="live-code-section">
        <LiveCodeEditor
          {playingPatterns}
          onEvaluate={handleLiveEvaluate}
          onStop={handleLiveStop}
        />
      </div>
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
    <p>Press buttons on your APCKEY25 or click the grid to play patterns • Turn knobs to adjust parameters • Edit code live with Ctrl+Enter • Press RECORD to capture keyboard melodies</p>
    <p class="version">Phase 2.4 - Live Code Editor</p>
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

  .keyboard-preview-controls {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 20px 15px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 30px;
    flex-wrap: wrap;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .toggle-label input[type="checkbox"] {
    display: none;
  }

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 26px;
    background: #333;
    border-radius: 13px;
    transition: background 0.3s;
    border: 2px solid #444;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: #888;
    border-radius: 50%;
    transition: all 0.3s;
  }

  .toggle-label input:checked + .toggle-switch {
    background: #4caf50;
    border-color: #4caf50;
  }

  .toggle-label input:checked + .toggle-switch::after {
    left: 26px;
    background: white;
  }

  .toggle-text {
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .synth-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .synth-label {
    font-size: 14px;
    font-weight: 600;
    color: #888;
  }

  .synth-dropdown {
    padding: 6px 12px;
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .synth-dropdown:hover {
    border-color: #4caf50;
  }

  .synth-dropdown:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
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

  .left-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .grid-section h2 {
    margin: 0 0 15px 0;
    font-size: 20px;
    color: #4caf50;
    padding: 0 20px;
  }

  .live-code-section {
    min-height: 400px;
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

    .left-column {
      order: 1;
    }

    .info-section {
      order: 0;
    }

    .live-code-section {
      min-height: 300px;
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
