<script lang="ts">
  import type { PatternSlot } from '../../lib/types';

  export let patterns: PatternSlot[] = [];
  export let onPatternClick: (slotId: number) => void = () => {};
  export let onPatternEdit: (slotId: number) => void = () => {};

  // Organize patterns into 5 rows x 8 columns
  $: grid = Array.from({ length: 5 }, (_, rowIndex) => {
    return patterns.slice(rowIndex * 8, (rowIndex + 1) * 8);
  });
</script>

<div class="pattern-grid">
  {#each grid as row, rowIndex}
    <div class="pattern-row">
      {#each row as pattern}
        <button
          class="pattern-cell"
          class:playing={pattern.isPlaying}
          style="--led-color: {pattern.isPlaying ? `rgb(${pattern.ledColor === 5 ? '255,0,0' : pattern.ledColor === 13 ? '0,255,0' : '255,255,0'})` : '#333'}"
          on:click={() => onPatternClick(pattern.id)}
          on:dblclick={() => onPatternEdit(pattern.id)}
          title="{pattern.name} (Double-click to edit)"
        >
          <div class="pattern-id">{pattern.id}</div>
          <div class="pattern-name">{pattern.name}</div>
        </button>
      {/each}
    </div>
  {/each}
</div>

<style>
  .pattern-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px;
    background: #0a0a0a;
    border-radius: 12px;
  }

  .pattern-row {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }

  .pattern-cell {
    aspect-ratio: 1;
    border: 2px solid var(--led-color);
    border-radius: 8px;
    background: #1a1a1a;
    color: #888;
    padding: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    text-align: center;
    min-height: 60px;
  }

  .pattern-cell:hover {
    background: #2a2a2a;
    border-color: #4caf50;
    transform: scale(1.05);
  }

  .pattern-cell.playing {
    background: rgba(76, 175, 80, 0.15);
    color: #4caf50;
    font-weight: bold;
    border-width: 3px;
    box-shadow: 0 0 20px var(--led-color);
  }

  .pattern-id {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;
    opacity: 0.6;
  }

  .pattern-cell.playing .pattern-id {
    opacity: 1;
  }

  .pattern-name {
    font-size: 10px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  @media (max-width: 768px) {
    .pattern-grid {
      padding: 10px;
    }

    .pattern-row {
      gap: 4px;
    }

    .pattern-cell {
      min-height: 50px;
      font-size: 9px;
    }

    .pattern-id {
      font-size: 12px;
    }
  }
</style>
