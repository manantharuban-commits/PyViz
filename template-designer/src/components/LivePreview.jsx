import React, { useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { generateOutlookHTML } from '../utils/htmlGenerator';
import '../styles/LivePreview.css';

export const LivePreview = () => {
  const { elements, sampleData } = useCanvasStore();

  const htmlContent = useMemo(() => {
    return generateOutlookHTML(elements, sampleData);
  }, [elements, sampleData]);

  return (
    <div className="live-preview">
      <h3>👁️ Live Preview</h3>
      <div className="preview-container">
        <iframe
          srcDoc={htmlContent}
          title="Email Preview"
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>
      <div className="preview-note">
        This preview shows how your template will look with sample data substituted.
      </div>
    </div>
  );
};
