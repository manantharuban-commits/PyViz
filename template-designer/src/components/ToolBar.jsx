import React, { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { generateOutlookHTML, generateTemplateHTML, validateOutlookConstraints } from '../utils/htmlGenerator';
import { HtmlPreview } from './HtmlPreview';
import '../styles/ToolBar.css';

export const ToolBar = () => {
  const { mode, setMode, gridSize, setGridSize, elements, sampleData, clearAll, undo, redo, canUndo, canRedo } = useCanvasStore();
  const [copyLabel, setCopyLabel] = useState('📋 Copy Template');

  const handleExport = () => {
    const warnings = validateOutlookConstraints(elements);

    let shouldExport = true;
    if (warnings.length > 0) {
      const message = `Warnings:\n\n${warnings.join('\n')}\n\nContinue export?`;
      shouldExport = window.confirm(message);
    }
    if (!shouldExport) return;

    const html = generateOutlookHTML(elements, sampleData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-template-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = async () => {
    const html = generateTemplateHTML(elements);
    try {
      await navigator.clipboard.writeText(html);
      setCopyLabel('✓ Copied!');
      setTimeout(() => setCopyLabel('📋 Copy Template'), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = html;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyLabel('✓ Copied!');
      setTimeout(() => setCopyLabel('📋 Copy Template'), 2000);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <label>
          <input
            type="radio"
            name="mode"
            value="grid"
            checked={mode === 'grid'}
            onChange={() => setMode('grid')}
          />
          Grid ({gridSize}px)
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            value="freeform"
            checked={mode === 'freeform'}
            onChange={() => setMode('freeform')}
          />
          Freeform
        </label>
      </div>

      {mode === 'grid' && (
        <div className="toolbar-group">
          <label>
            Grid Size:
            <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}>
              <option value={4}>4px</option>
              <option value={8}>8px</option>
              <option value={10}>10px</option>
              <option value={16}>16px</option>
            </select>
          </label>
        </div>
      )}

      <div className="toolbar-group">
        <button onClick={undo} disabled={!canUndo()} className="btn-secondary" title="Undo (Ctrl+Z)">
          ↶ Undo
        </button>
        <button onClick={redo} disabled={!canRedo()} className="btn-secondary" title="Redo (Ctrl+Y)">
          ↷ Redo
        </button>
      </div>

      <div className="toolbar-group">
        <button onClick={handleExport} className="btn-primary" title="Download .html with sample data applied">
          📥 Export HTML
        </button>
        <button
          onClick={handleCopyTemplate}
          className="btn-secondary"
          title="Copy full Outlook-safe HTML with {{PLACEHOLDERS}} intact — paste into BigQuery email_list.html_template"
        >
          {copyLabel}
        </button>
        <HtmlPreview />
        <button onClick={clearAll} className="btn-secondary">
          🗑️ Clear All
        </button>
      </div>

      <div className="toolbar-info">
        {elements.length} elements
      </div>
    </div>
  );
};
