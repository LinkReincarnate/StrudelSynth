<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Block from './Block.svelte';
  import type { Block as BlockType, BlockProgram, BlockCategory } from '../blocks/blockTypes';
  import type { DynamicParameter } from '../types';
  import {
    BLOCK_DEFINITIONS,
    createBlock,
    getCategories,
    getBlocksByCategory
  } from '../blocks/blockTypes';
  import { generateProgramCode, validateBlock, describeBlock } from '../blocks/codeGenerator';
  import { extractParameters, createDynamicParameters } from '../parameterDetector';

  export let program: BlockProgram = { blocks: [] };

  const dispatch = createEventDispatcher();

  let selectedCategory: BlockCategory = 'sound';
  let generatedCode = '';
  let showPalette = true;
  let errorMessage: string | null = null;
  let detectedParameters: DynamicParameter[] = [];

  // Categories with colors
  const categories = [
    { id: 'sound' as BlockCategory, name: 'Sound', icon: '🎵', color: '#FF6B6B' },
    { id: 'time' as BlockCategory, name: 'Time', icon: '⏱️', color: '#4ECDC4' },
    { id: 'effect' as BlockCategory, name: 'Effects', icon: '🎛️', color: '#95E1D3' },
    { id: 'pattern' as BlockCategory, name: 'Pattern', icon: '🔀', color: '#FFD93D' },
    { id: 'control' as BlockCategory, name: 'Control', icon: '🎲', color: '#A78BFA' },
    { id: 'data' as BlockCategory, name: 'Data', icon: '📊', color: '#F59E0B' },
    { id: 'logic' as BlockCategory, name: 'Logic', icon: '🔁', color: '#EC4899' },
    { id: 'value' as BlockCategory, name: 'Values', icon: '🔢', color: '#10B981' },
  ];

  $: availableBlocks = getBlocksByCategory(selectedCategory);
  $: generateCode();

  function generateCode() {
    try {
      generatedCode = generateProgramCode(program);
      errorMessage = null;

      // Detect parameters from generated code
      const paramNames = extractParameters(generatedCode);
      detectedParameters = createDynamicParameters(paramNames, detectedParameters);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to generate code';
      generatedCode = '';
      detectedParameters = [];
    }
  }

  function addBlock(definitionId: string) {
    const newBlock = createBlock(definitionId);

    // Validate before adding
    const error = validateBlock(newBlock);
    if (error) {
      alert(`Cannot add block: ${error}`);
      return;
    }

    program.blocks = [...program.blocks, newBlock];
    generateCode();
  }

  function handleBlockChange() {
    program = program; // Trigger reactivity
    generateCode();
  }

  function handleAddChild(event: CustomEvent) {
    const { parentBlock } = event.detail;

    // Show selection dialog or add a default effect
    const newChild = createBlock('effect_gain');
    parentBlock.children = [...parentBlock.children, newChild];
    handleBlockChange();
  }

  function handleDeleteBlock(event: CustomEvent) {
    const { block } = event.detail;
    program.blocks = program.blocks.filter(b => b.instanceId !== block.instanceId);
    generateCode();
  }

  function clearAll() {
    if (confirm('Clear all blocks?')) {
      program.blocks = [];
      generateCode();
    }
  }

  function useCode() {
    dispatch('useCode', { code: generatedCode });
  }

  function togglePalette() {
    showPalette = !showPalette;
  }
</script>

<div class="block-editor">
  <div class="editor-header">
    <h2>🎨 Block Editor</h2>
    <div class="header-actions">
      <button class="btn-toggle-palette" on:click={togglePalette}>
        {showPalette ? '◀' : '▶'} Palette
      </button>
      <button class="btn-clear" on:click={clearAll}>🗑️ Clear</button>
      <button class="btn-use-code" on:click={useCode} disabled={!generatedCode || errorMessage !== null}>
        ✨ Use Code
      </button>
    </div>
  </div>

  <div class="editor-body" class:palette-hidden={!showPalette}>
    <!-- Block Palette -->
    {#if showPalette}
      <div class="block-palette">
        <div class="palette-header">
          <h3>Block Palette</h3>
        </div>

        <div class="category-tabs">
          {#each categories as category}
            <button
              class="category-tab"
              class:active={selectedCategory === category.id}
              style="border-bottom-color: {category.color};"
              on:click={() => selectedCategory = category.id}
            >
              <span class="category-icon">{category.icon}</span>
              <span class="category-name">{category.name}</span>
            </button>
          {/each}
        </div>

        <div class="blocks-list">
          {#each availableBlocks as blockDef}
            <button
              class="palette-block"
              style="border-left-color: {blockDef.color};"
              on:click={() => addBlock(blockDef.id)}
              title={blockDef.description}
            >
              <div class="palette-block-name">{blockDef.name}</div>
              {#if blockDef.example}
                <div class="palette-block-example">{blockDef.example}</div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Workspace -->
    <div class="workspace">
      <div class="workspace-header">
        <h3>Workspace</h3>
        <span class="block-count">{program.blocks.length} block{program.blocks.length !== 1 ? 's' : ''}</span>
      </div>

      <div class="workspace-canvas">
        {#if program.blocks.length === 0}
          <div class="empty-state">
            <p>👈 Drag blocks from the palette to start building</p>
            <span>Click a block type to add it here</span>
          </div>
        {:else}
          {#each program.blocks as block}
            <Block
              {block}
              on:change={handleBlockChange}
              on:addChild={handleAddChild}
              on:delete={handleDeleteBlock}
            />
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Generated Code Preview -->
  <div class="code-preview">
    <div class="preview-header">
      <h3>Generated Code</h3>
      {#if errorMessage}
        <span class="error-badge">❌ Error</span>
      {:else if generatedCode}
        <span class="success-badge">✅ Valid</span>
      {/if}
    </div>
    <div class="preview-body">
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {:else if generatedCode}
        <code class="generated-code">{generatedCode}</code>
      {:else}
        <div class="empty-code">No blocks yet</div>
      {/if}
    </div>
  </div>

  <!-- Parameters Preview -->
  {#if detectedParameters.length > 0}
    <div class="parameters-preview">
      <div class="preview-header">
        <h3>📊 Detected Parameters</h3>
        <span class="param-count">{detectedParameters.length} parameter{detectedParameters.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="parameters-list">
        {#each detectedParameters as param}
          <div class="parameter-item">
            <div class="param-name">${param.name}</div>
            <div class="param-info">
              <span class="param-range">Range: {param.minValue} - {param.maxValue}</span>
              <span class="param-value">Default: {param.value.toFixed(2)}</span>
            </div>
            <div class="param-hint">
              💡 This will be controllable via MIDI knobs when you use the code
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .block-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0a0a0a;
    border-radius: 8px;
    overflow: hidden;
  }

  .editor-header {
    padding: 16px 20px;
    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editor-header h2 {
    margin: 0;
    font-size: 20px;
    color: #4caf50;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .header-actions button {
    padding: 8px 16px;
    font-size: 13px;
    border: 2px solid;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    font-family: inherit;
  }

  .btn-toggle-palette {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .btn-toggle-palette:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-clear {
    background: rgba(244, 67, 54, 0.1);
    border-color: #f44336;
    color: #f44336;
  }

  .btn-clear:hover {
    background: rgba(244, 67, 54, 0.2);
  }

  .btn-use-code {
    background: rgba(76, 175, 80, 0.1);
    border-color: #4caf50;
    color: #4caf50;
  }

  .btn-use-code:hover:not(:disabled) {
    background: rgba(76, 175, 80, 0.2);
  }

  .btn-use-code:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-body.palette-hidden {
    grid-template-columns: 0 1fr;
  }

  .block-palette {
    width: 280px;
    background: rgba(0, 0, 0, 0.4);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .palette-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .palette-header h3 {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .category-tabs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
  }

  .category-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: none;
    border-left: 3px solid transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    text-align: left;
  }

  .category-tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  .category-tab.active {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-left-width: 3px;
  }

  .category-icon {
    font-size: 18px;
  }

  .blocks-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .palette-block {
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left-width: 4px;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .palette-block:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(4px);
  }

  .palette-block-name {
    font-weight: 600;
    font-size: 13px;
    color: #fff;
    margin-bottom: 4px;
  }

  .palette-block-example {
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: rgba(255, 255, 255, 0.5);
  }

  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .workspace-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .workspace-header h3 {
    margin: 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .block-count {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .workspace-canvas {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: rgba(255, 255, 255, 0.4);
  }

  .empty-state p {
    font-size: 16px;
    margin: 0 0 8px 0;
  }

  .empty-state span {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
  }

  .code-preview {
    background: rgba(0, 0, 0, 0.6);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 200px;
  }

  .preview-header {
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-header h3 {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .success-badge {
    font-size: 11px;
    color: #4caf50;
    font-weight: 600;
  }

  .error-badge {
    font-size: 11px;
    color: #f44336;
    font-weight: 600;
  }

  .preview-body {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;
  }

  .generated-code {
    display: block;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #00ff88;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .empty-code {
    color: rgba(255, 255, 255, 0.3);
    font-style: italic;
    font-size: 13px;
  }

  .error-message {
    color: #f44336;
    font-size: 13px;
    padding: 12px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-radius: 4px;
  }

  /* Scrollbar styles */
  .blocks-list::-webkit-scrollbar,
  .workspace-canvas::-webkit-scrollbar,
  .preview-body::-webkit-scrollbar {
    width: 8px;
  }

  .blocks-list::-webkit-scrollbar-track,
  .workspace-canvas::-webkit-scrollbar-track,
  .preview-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  .blocks-list::-webkit-scrollbar-thumb,
  .workspace-canvas::-webkit-scrollbar-thumb,
  .preview-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .blocks-list::-webkit-scrollbar-thumb:hover,
  .workspace-canvas::-webkit-scrollbar-thumb:hover,
  .preview-body::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Parameters Preview */
  .parameters-preview {
    background: rgba(245, 158, 11, 0.1);
    border-top: 1px solid rgba(245, 158, 11, 0.3);
    display: flex;
    flex-direction: column;
    max-height: 200px;
  }

  .param-count {
    font-size: 12px;
    color: rgba(245, 158, 11, 0.8);
    background: rgba(245, 158, 11, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .parameters-list {
    flex: 1;
    padding: 12px 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .parameter-item {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-left: 3px solid #F59E0B;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .param-name {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: 600;
    color: #F59E0B;
  }

  .param-info {
    display: flex;
    gap: 16px;
    font-size: 12px;
  }

  .param-range {
    color: rgba(255, 255, 255, 0.6);
  }

  .param-value {
    color: rgba(255, 255, 255, 0.6);
  }

  .param-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
    margin-top: 4px;
  }
</style>
