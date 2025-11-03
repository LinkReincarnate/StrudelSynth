<script lang="ts">
  import { onMount } from 'svelte';
  import PatternGrid from './lib/components/PatternGrid.svelte';
  import StatusBar from './lib/components/StatusBar.svelte';
  import PatternInfo from './lib/components/PatternInfo.svelte';
  import PatternEditor from './lib/components/PatternEditor.svelte';
  import { PatternEngine } from './pattern/PatternEngine';
  import { MIDIManager } from './midi/MIDIManager';
  import type { PatternSlot } from './lib/types';
  import { LED_COLORS } from './lib/constants';
  import { savePattern, loadCustomPatterns } from './lib/storage';

  // State
  let patternEngine: PatternEngine;
  let midiManager: MIDIManager;
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

  // Reactive playingCount
  $: playingCount = playingPatterns.length;

  onMount(() => {
    // Initialize engines
    patternEngine = new PatternEngine();
    midiManager = new MIDIManager();

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
        // Button pressed - toggle pattern
        handlePatternToggle(event.note);
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

    try {
      const slot = patterns.find(p => p.id === slotId);
      if (!slot) return;

      // Toggle pattern
      patternEngine.togglePattern(slotId);

      // Update LED
      const ledColor = patternEngine.getLEDColor(slotId);
      midiManager.setLED(slotId, ledColor);
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
    <p>Press buttons on your APCKEY25 or click the grid to play patterns</p>
    <p class="version">Phase 2.1 - Pattern Editor</p>
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
