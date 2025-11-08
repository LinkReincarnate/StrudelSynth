<script lang="ts">
  import type { PatternSlot } from '../types';
  import BlockEditor from './BlockEditor.svelte';
  import type { BlockProgram } from '../blocks/blockTypes';

  export let playingPatterns: PatternSlot[] = [];
  export let onEvaluate: (slotId: number, code: string) => void = () => {};
  export let onStop: (slotId: number) => void = () => {};

  // Editor mode
  let editorMode: 'code' | 'blocks' = 'code';
  let blockProgram: BlockProgram = { blocks: [] };
  let selectedPatternForBlocks: number | null = null;

  // State
  let editingCode: Map<number, string> = new Map();
  let errors: Map<number, string> = new Map();
  let lastEvaluated: Map<number, number> = new Map(); // timestamp of last evaluation

  // Update local editing state when playing patterns change
  $: {
    // Sync editingCode with playingPatterns
    const currentIds = new Set(playingPatterns.map(p => p.id));

    // Remove patterns that are no longer playing
    editingCode = new Map(
      Array.from(editingCode.entries()).filter(([id]) => currentIds.has(id))
    );

    // Initialize code for new patterns
    playingPatterns.forEach(pattern => {
      if (!editingCode.has(pattern.id)) {
        editingCode.set(pattern.id, pattern.code);
      }
    });

    // Trigger reactivity
    editingCode = editingCode;
  }

  function handleEvaluate(slotId: number) {
    const code = editingCode.get(slotId);
    if (!code) return;

    try {
      onEvaluate(slotId, code.trim());
      errors.delete(slotId);
      lastEvaluated.set(slotId, Date.now());

      // Trigger reactivity
      errors = errors;
      lastEvaluated = lastEvaluated;

      console.log(`✅ Evaluated pattern ${slotId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.set(slotId, errorMsg);
      errors = errors;
      console.error(`❌ Evaluation failed for pattern ${slotId}:`, errorMsg);
    }
  }

  function handleStop(slotId: number) {
    onStop(slotId);
    editingCode.delete(slotId);
    errors.delete(slotId);
    editingCode = editingCode;
    errors = errors;
  }

  function handleKeyDown(event: KeyboardEvent, slotId: number) {
    // Ctrl+Enter or Cmd+Enter to evaluate
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleEvaluate(slotId);
    }
    // Ctrl+. or Cmd+. to stop
    else if ((event.ctrlKey || event.metaKey) && event.key === '.') {
      event.preventDefault();
      handleStop(slotId);
    }
  }

  function updateCode(slotId: number, value: string) {
    editingCode.set(slotId, value);
    editingCode = editingCode;
  }

  function getPatternColor(pattern: PatternSlot): string {
    if (pattern.ledColor === 13) return '#4caf50'; // green
    if (pattern.ledColor === 5) return '#f44336'; // red
    if (pattern.ledColor === 96) return '#ffa500'; // yellow
    return '#888';
  }

  function switchMode(mode: 'code' | 'blocks') {
    editorMode = mode;
    // If switching to blocks and we have playing patterns, select the first one by default
    if (mode === 'blocks' && playingPatterns.length > 0 && !selectedPatternForBlocks) {
      selectedPatternForBlocks = playingPatterns[0].id;
    }
  }

  function handleUseBlockCode(event: CustomEvent) {
    const { code } = event.detail;

    // If no pattern selected, alert user
    if (selectedPatternForBlocks === null) {
      if (playingPatterns.length === 0) {
        alert('Start a pattern first before using block-generated code');
      } else {
        alert('Please select a pattern to apply the block code to');
      }
      return;
    }

    // Apply the generated code to the selected pattern
    updateCode(selectedPatternForBlocks, code);
    handleEvaluate(selectedPatternForBlocks);

    // Switch to code mode to show the result
    editorMode = 'code';
  }
</script>

<div class="live-code-editor">
  <div class="editor-header">
    <h2>🎹 Live Code</h2>
    <div class="editor-tabs">
      <button
        class="tab"
        class:active={editorMode === 'code'}
        on:click={() => switchMode('code')}
      >
        💻 Code
      </button>
      <button
        class="tab"
        class:active={editorMode === 'blocks'}
        on:click={() => switchMode('blocks')}
      >
        🧱 Blocks
      </button>
    </div>
    {#if editorMode === 'code'}
      <div class="hints">
        <span class="hint">Ctrl+Enter = Evaluate</span>
        <span class="hint">Ctrl+. = Stop</span>
      </div>
    {/if}
  </div>

  {#if editorMode === 'blocks'}
    <div class="blocks-mode">
      {#if playingPatterns.length > 0}
        <div class="pattern-selector">
          <label for="target-pattern">Apply blocks to:</label>
          <select id="target-pattern" bind:value={selectedPatternForBlocks}>
            {#each playingPatterns as pattern}
              <option value={pattern.id}>#{pattern.id} - {pattern.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div class="block-editor-container">
        <BlockEditor
          bind:program={blockProgram}
          on:useCode={handleUseBlockCode}
        />
      </div>
    </div>
  {:else if playingPatterns.length === 0}
    <div class="empty-state">
      <p class="empty-icon">🎵</p>
      <p>No patterns playing</p>
      <p class="empty-hint">Press buttons on your APCKEY25 or click the grid to start</p>
    </div>
  {:else}
    <div class="patterns-list">
      {#each playingPatterns as pattern (pattern.id)}
        <div class="pattern-card" style="border-left-color: {getPatternColor(pattern)}">
          <div class="pattern-header">
            <div class="pattern-info">
              <span class="pattern-id">#{pattern.id}</span>
              <span class="pattern-name">{pattern.name}</span>
              {#if pattern.category}
                <span class="pattern-category">{pattern.category}</span>
              {/if}
            </div>
            <div class="pattern-actions">
              <button
                class="btn-action btn-eval"
                on:click={() => handleEvaluate(pattern.id)}
                title="Evaluate (Ctrl+Enter)"
              >
                ▶ Eval
              </button>
              <button
                class="btn-action btn-stop"
                on:click={() => handleStop(pattern.id)}
                title="Stop (Ctrl+.)"
              >
                ■ Stop
              </button>
            </div>
          </div>

          <textarea
            class="code-input"
            class:has-error={errors.has(pattern.id)}
            value={editingCode.get(pattern.id) || pattern.code}
            on:input={(e) => updateCode(pattern.id, e.currentTarget.value)}
            on:keydown={(e) => handleKeyDown(e, pattern.id)}
            placeholder="Enter Strudel code..."
            rows="4"
            spellcheck="false"
          ></textarea>

          {#if errors.has(pattern.id)}
            <div class="error-message">
              ❌ {errors.get(pattern.id)}
            </div>
          {/if}

          {#if lastEvaluated.has(pattern.id)}
            <div class="eval-indicator">
              ✅ Evaluated {new Date(lastEvaluated.get(pattern.id)).toLocaleTimeString()}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .live-code-editor {
    background: #0a0a0a;
    border-radius: 8px;
    border: 2px solid #333;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 400px;
  }

  .editor-header {
    padding: 15px 20px;
    background: #1a1a1a;
    border-bottom: 2px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 20px;
    color: #4caf50;
  }

  .editor-tabs {
    display: flex;
    gap: 4px;
  }

  .tab {
    padding: 10px 20px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
    font-family: inherit;
  }

  .tab:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
  }

  .tab.active {
    color: #00d9ff;
    border-bottom-color: #00d9ff;
  }

  .hints {
    display: flex;
    gap: 15px;
    margin-left: auto;
  }

  .hint {
    font-size: 12px;
    color: #666;
    font-family: 'Courier New', monospace;
  }

  .blocks-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .pattern-selector {
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pattern-selector label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
  }

  .pattern-selector select {
    flex: 1;
    max-width: 400px;
    padding: 8px 12px;
    background: #0a0a0a;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .pattern-selector select:hover {
    border-color: #4caf50;
  }

  .pattern-selector select:focus {
    outline: none;
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }

  .block-editor-container {
    flex: 1;
    overflow: hidden;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #666;
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  .empty-state p {
    margin: 5px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: #444;
  }

  .patterns-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .pattern-card {
    background: #1a1a1a;
    border: 2px solid #333;
    border-left-width: 4px;
    border-radius: 8px;
    padding: 15px;
    transition: all 0.2s;
  }

  .pattern-card:hover {
    border-color: #444;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .pattern-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .pattern-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pattern-id {
    font-family: 'Courier New', monospace;
    color: #888;
    font-size: 14px;
    font-weight: bold;
  }

  .pattern-name {
    font-weight: 600;
    color: #fff;
    font-size: 14px;
  }

  .pattern-category {
    font-size: 12px;
    color: #666;
    padding: 2px 8px;
    background: #0a0a0a;
    border-radius: 4px;
  }

  .pattern-actions {
    display: flex;
    gap: 8px;
  }

  .btn-action {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: bold;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Courier New', monospace;
  }

  .btn-eval {
    background: #4caf50;
    color: white;
  }

  .btn-eval:hover {
    background: #45a049;
    transform: scale(1.05);
  }

  .btn-stop {
    background: #f44336;
    color: white;
  }

  .btn-stop:hover {
    background: #da190b;
    transform: scale(1.05);
  }

  .code-input {
    width: 100%;
    padding: 12px;
    background: #0a0a0a;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    font-family: 'Courier New', Courier, monospace;
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
    transition: border-color 0.2s;
  }

  .code-input:focus {
    outline: none;
    border-color: #4caf50;
  }

  .code-input.has-error {
    border-color: #f44336;
  }

  .error-message {
    margin-top: 8px;
    padding: 10px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid #f44336;
    border-radius: 4px;
    color: #f44336;
    font-size: 12px;
    font-family: 'Courier New', monospace;
  }

  .eval-indicator {
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid #4caf50;
    border-radius: 4px;
    color: #4caf50;
    font-size: 11px;
    text-align: right;
  }

  /* Scrollbar styling */
  .patterns-list::-webkit-scrollbar {
    width: 8px;
  }

  .patterns-list::-webkit-scrollbar-track {
    background: #0a0a0a;
  }

  .patterns-list::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }

  .patterns-list::-webkit-scrollbar-thumb:hover {
    background: #444;
  }

  @media (max-width: 1024px) {
    .hints {
      display: none;
    }

    .pattern-info {
      flex-wrap: wrap;
    }

    .pattern-actions {
      flex-direction: column;
    }
  }
</style>
