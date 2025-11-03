<script lang="ts">
  import type { PatternSlot } from '../../lib/types';

  export let selectedPattern: PatternSlot | null = null;
  export let playingPatterns: PatternSlot[] = [];
  export let onEdit: (slotId: number) => void = () => {};
</script>

<div class="pattern-info">
  {#if selectedPattern}
    <div class="info-section">
      <div class="section-header">
        <h3>Selected Pattern</h3>
        <button class="edit-btn" on:click={() => onEdit(selectedPattern.id)}>
          ✏️ Edit
        </button>
      </div>
      <div class="pattern-details">
        <div class="detail-row">
          <span class="label">Slot:</span>
          <span class="value">{selectedPattern.id}</span>
        </div>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">{selectedPattern.name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Category:</span>
          <span class="value">{selectedPattern.category}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="value" class:playing={selectedPattern.isPlaying}>
            {selectedPattern.isPlaying ? '▶️ Playing' : '⏸️ Stopped'}
          </span>
        </div>
      </div>
      <div class="code-section">
        <div class="code-label">Pattern Code:</div>
        <pre class="code-block"><code>{selectedPattern.code}</code></pre>
      </div>
    </div>
  {/if}

  {#if playingPatterns.length > 0}
    <div class="info-section">
      <h3>Currently Playing ({playingPatterns.length})</h3>
      <div class="playing-list">
        {#each playingPatterns as pattern}
          <div class="playing-item">
            <span class="playing-id">{pattern.id}</span>
            <span class="playing-name">{pattern.name}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="info-section empty">
      <p>🎵 No patterns playing</p>
      <p class="hint">Click a pattern or press a button on your APCKEY25 to start</p>
    </div>
  {/if}
</div>

<style>
  .pattern-info {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    background: #0a0a0a;
    border-radius: 12px;
    max-height: 500px;
    overflow-y: auto;
  }

  .info-section {
    background: #1a1a1a;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #333;
  }

  .info-section.empty {
    text-align: center;
    color: #666;
    padding: 30px;
  }

  .hint {
    font-size: 12px;
    margin-top: 10px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    color: #4caf50;
  }

  .edit-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    background: #333;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: #4caf50;
    border-color: #4caf50;
    transform: scale(1.05);
  }

  .pattern-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #222;
  }

  .label {
    color: #888;
    font-size: 13px;
  }

  .value {
    color: #fff;
    font-size: 13px;
    font-weight: 500;
  }

  .value.playing {
    color: #4caf50;
  }

  .code-section {
    margin-top: 15px;
  }

  .code-label {
    color: #888;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .code-block {
    background: #000;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0;
  }

  code {
    color: #4caf50;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }

  .playing-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .playing-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(76, 175, 80, 0.1);
    border-left: 3px solid #4caf50;
    border-radius: 4px;
  }

  .playing-id {
    font-weight: bold;
    color: #4caf50;
    min-width: 30px;
  }

  .playing-name {
    color: #fff;
    font-size: 13px;
  }

  /* Scrollbar styling */
  .pattern-info::-webkit-scrollbar {
    width: 8px;
  }

  .pattern-info::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }

  .pattern-info::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }

  .pattern-info::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
</style>
