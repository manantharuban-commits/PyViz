import React, { useState } from 'react';
import { generateOutlookHTML } from '../utils/htmlGenerator';
import { useCanvasStore } from '../store/canvasStore';
import '../styles/HtmlPreview.css';

export const HtmlPreview = () => {
  const { elements, sampleData } = useCanvasStore();
  const [isOpen, setIsOpen] = useState(false);

  const html = generateOutlookHTML(elements, sampleData);

  const handleCopy = () => {
    navigator.clipboard.writeText(html);
    alert('✓ HTML copied to clipboard!');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          margin: '8px',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          background: '#f0f0f0',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        📋 View HTML
      </button>

      {isOpen && (
        <div className="html-preview-modal">
          <div className="html-preview-container">
            <div className="html-preview-header">
              <h3>Generated HTML</h3>
              <button onClick={handleCopy} className="btn-copy">
                📋 Copy
              </button>
              <button onClick={() => setIsOpen(false)} className="btn-close">
                ✕
              </button>
            </div>
            <pre className="html-preview-code">{html}</pre>
          </div>
        </div>
      )}
    </>
  );
};
