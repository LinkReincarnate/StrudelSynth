<script lang="ts">
  import type { PatternSlot } from '../../lib/types';
  import { LED_COLORS } from '../../lib/constants';

  export let pattern: PatternSlot | null = null;
  export let onSave: (pattern: PatternSlot) => void = () => {};
  export let onCancel: () => void = () => {};
  export let onTest: (code: string) => void = () => {};
  export let visible: boolean = false;

  // Editable fields
  let editName = '';
  let editCode = '';
  let editCategory = '';
  let editColor = LED_COLORS.GREEN;

  // State
  let testing = false;
  let validationMessage = '';
  let validationError = false;

  // When pattern changes, update fields
  $: if (pattern) {
    editName = pattern.name;
    editCode = pattern.code;
    editCategory = pattern.category;
    editColor = pattern.ledColor;
    validationMessage = '';
    validationError = false;
  }

  function handleTest() {
    testing = true;
    validationError = false;
    validationMessage = 'Testing pattern...';

    try {
      onTest(editCode);
      validationMessage = '✅ Pattern is valid!';
      validationError = false;
    } catch (error) {
      validationMessage = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      validationError = true;
    } finally {
      testing = false;
    }
  }

  function handleSave() {
    if (!pattern) return;

    // Validate fields
    if (!editName.trim()) {
      validationMessage = '❌ Name is required';
      validationError = true;
      return;
    }

    if (!editCode.trim()) {
      validationMessage = '❌ Code is required';
      validationError = true;
      return;
    }

    // Create updated pattern
    const updatedPattern: PatternSlot = {
      ...pattern,
      name: editName.trim(),
      code: editCode.trim(),
      category: editCategory.trim() || 'custom',
      ledColor: editColor,
      lastModified: Date.now(),
    };

    onSave(updatedPattern);
  }

  function handleClose() {
    validationMessage = '';
    validationError = false;
    onCancel();
  }

  // Color options
  const colorOptions = [
    { label: 'Green (Playing)', value: LED_COLORS.GREEN },
    { label: 'Red (Recording)', value: LED_COLORS.RED },
    { label: 'Yellow (Loaded)', value: LED_COLORS.YELLOW },
  ];
</script>

{#if visible && pattern}
  <div class="editor-overlay" on:click={handleClose}>
    <div class="editor-modal" on:click|stopPropagation>
      <div class="editor-header">
        <h2>Edit Pattern #{pattern.id}</h2>
        <button class="close-btn" on:click={handleClose}>✕</button>
      </div>

      <div class="editor-body">
        <div class="form-group">
          <label for="pattern-name">Pattern Name</label>
          <input
            id="pattern-name"
            type="text"
            bind:value={editName}
            placeholder="e.g., Kick Drum x2"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="pattern-category">Category</label>
          <input
            id="pattern-category"
            type="text"
            bind:value={editCategory}
            placeholder="e.g., drums, melody, bass"
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label for="pattern-color">LED Color</label>
          <select id="pattern-color" bind:value={editColor}>
            {#each colorOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="pattern-code">
            Strudel Pattern Code
            <span class="label-hint">
              <a href="https://strudel.cc/" target="_blank" rel="noopener">Strudel Docs</a>
            </span>
          </label>
          <textarea
            id="pattern-code"
            bind:value={editCode}
            placeholder="e.g., s('bd').fast(2)"
            rows="8"
            spellcheck="false"
          ></textarea>
        </div>

        {#if validationMessage}
          <div class="validation-message" class:error={validationError}>
            {validationMessage}
          </div>
        {/if}

        <div class="editor-actions">
          <button class="btn btn-secondary" on:click={handleTest} disabled={testing}>
            🧪 Test Pattern
          </button>
          <div class="spacer"></div>
          <button class="btn btn-secondary" on:click={handleClose}>
            Cancel
          </button>
          <button class="btn btn-primary" on:click={handleSave}>
            💾 Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .editor-modal {
    background: #1a1a1a;
    border-radius: 12px;
    border: 2px solid #333;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    border-bottom: 2px solid #333;
    background: #0a0a0a;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 24px;
    color: #4caf50;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #333;
    color: #fff;
  }

  .editor-body {
    padding: 25px;
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #888;
  }

  .label-hint {
    font-size: 12px;
    font-weight: normal;
  }

  .label-hint a {
    color: #4caf50;
    text-decoration: none;
  }

  .label-hint a:hover {
    text-decoration: underline;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 12px;
    background: #0a0a0a;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4caf50;
  }

  textarea {
    font-family: 'Courier New', Courier, monospace;
    resize: vertical;
    min-height: 150px;
    line-height: 1.5;
  }

  .validation-message {
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 14px;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid #4caf50;
    color: #4caf50;
  }

  .validation-message.error {
    background: rgba(244, 67, 54, 0.1);
    border-color: #f44336;
    color: #f44336;
  }

  .editor-actions {
    display: flex;
    gap: 10px;
    padding-top: 10px;
  }

  .spacer {
    flex: 1;
  }

  .btn {
    padding: 12px 24px;
    font-size: 14px;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #4caf50;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #45a049;
    transform: scale(1.05);
  }

  .btn-secondary {
    background: #333;
    color: #fff;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #444;
    transform: scale(1.05);
  }

  /* Scrollbar styling */
  .editor-body::-webkit-scrollbar {
    width: 8px;
  }

  .editor-body::-webkit-scrollbar-track {
    background: #0a0a0a;
  }

  .editor-body::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }

  .editor-body::-webkit-scrollbar-thumb:hover {
    background: #444;
  }

  @media (max-width: 768px) {
    .editor-overlay {
      padding: 0;
    }

    .editor-modal {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    .editor-header {
      padding: 15px 20px;
    }

    .editor-body {
      padding: 20px;
    }
  }
</style>
