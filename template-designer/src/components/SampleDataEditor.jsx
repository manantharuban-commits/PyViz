import React, { useState, useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import '../styles/SampleDataEditor.css';

export const SampleDataEditor = () => {
  const { sampleData, setSampleData, elements } = useCanvasStore();
  const [jsonInput, setJsonInput] = useState(JSON.stringify(sampleData, null, 2));
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract placeholder names from canvas
  const suggestedKeys = useMemo(() => {
    const keys = new Set();
    elements.forEach((el) => {
      const text = `${el.content || ''} ${el.text || ''} ${el.chartName || ''}`;
      const matches = text.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach((match) => {
          const key = match.replace(/\{\{|\}\}/g, '');
          keys.add(key);
        });
      }
    });
    return Array.from(keys);
  }, [elements]);

  const handleJsonChange = (e) => {
    const value = e.target.value;
    setJsonInput(value);

    try {
      const parsed = JSON.parse(value);
      setSampleData(parsed);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const addSampleField = (key = null) => {
    const fieldKey = key || prompt('Field name (e.g., USER_NAME):');
    if (fieldKey) {
      const value = prompt('Value:') || '';
      if (value !== null) {
        const updated = { ...sampleData, [fieldKey]: value };
        setSampleData(updated);
        setJsonInput(JSON.stringify(updated, null, 2));
        setError(null);
        setShowSuggestions(false);
      }
    }
  };

  const addSuggestedKey = (key) => {
    if (!sampleData.hasOwnProperty(key)) {
      addSampleField(key);
    }
  };

  return (
    <div className="sample-data-editor">
      <h3>📊 Sample Data</h3>
      <p className="editor-hint">Mock data for preview. Use {'{{KEY}}'} in template.</p>

      <div className="json-editor-container">
        <textarea
          value={jsonInput}
          onChange={handleJsonChange}
          className={error ? 'error' : ''}
          placeholder='{"USER_NAME": "John Doe", "REPORT_DATE": "2026-04-30"}'
        />
        {error && <div className="error-message">❌ {error}</div>}
      </div>

      <div className="editor-controls">
        <button onClick={() => addSampleField()} className="btn-small">
          ➕ Add Field
        </button>
        {suggestedKeys.length > 0 && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="btn-small"
          >
            💡 {suggestedKeys.length} Suggested
          </button>
        )}
      </div>

      {showSuggestions && suggestedKeys.length > 0 && (
        <div className="suggestions-list">
          <h4>Detected placeholders:</h4>
          <div className="suggestions-grid">
            {suggestedKeys.map((key) => (
              <button
                key={key}
                onClick={() => addSuggestedKey(key)}
                className={`suggestion-chip ${sampleData.hasOwnProperty(key) ? 'added' : ''}`}
                disabled={sampleData.hasOwnProperty(key)}
              >
                {`{{${key}}}`}{sampleData.hasOwnProperty(key) ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="data-preview">
        <h4>Current Data ({Object.keys(sampleData).length}):</h4>
        <ul>
          {Object.entries(sampleData).map(([key, value]) => (
            <li key={key}>
              <code>{`{{${key}}}`}</code> → <span>{String(value).substring(0, 40)}</span>
            </li>
          ))}
          {Object.keys(sampleData).length === 0 && <li style={{ color: '#999' }}>Empty</li>}
        </ul>
      </div>
    </div>
  );
};
