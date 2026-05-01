import React from 'react';
import '../styles/LandingPage.css';

const features = [
  {
    icon: '🖱️',
    title: 'Drag & Drop Canvas',
    desc: 'Place text, headings, charts, buttons, images and spacers visually. Snap to grid or freeform.',
  },
  {
    icon: '📊',
    title: 'Chart Placeholders',
    desc: 'Drop a chart block, name it — the engine injects {{CHART_NAME}} into the final HTML automatically.',
  },
  {
    icon: '📧',
    title: 'Outlook-Safe HTML',
    desc: 'Exports table-based layout with fully inlined styles. VML button fallback for Outlook 2013–2019.',
  },
  {
    icon: '📋',
    title: 'BigQuery Ready',
    desc: 'Copy Template preserves all {{PLACEHOLDERS}} — paste directly into email_list.html_template.',
  },
  {
    icon: '⚠️',
    title: 'Live Warnings',
    desc: 'Per-element Outlook constraint checks: width limits, missing alt text, button VML notes.',
  },
  {
    icon: '↶',
    title: 'Undo / Redo',
    desc: 'Full history. Ctrl+Z / Ctrl+Y. Keyboard shortcuts for delete, duplicate, bold, align, nudge.',
  },
];

export const LandingPage = ({ onStart }) => {
  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-badge">v1.0 — Phase 5</div>
        <h1 className="landing-title">
          Outlook Email<br />Template Designer
        </h1>
        <p className="landing-subtitle">
          Build Outlook-safe HTML email templates visually.<br />
          Powered by BigQuery · No code required.
        </p>
        <button className="landing-cta" onClick={onStart}>
          Open Designer →
        </button>
      </div>

      <div className="landing-features">
        {features.map((f) => (
          <div key={f.title} className="landing-feature-card">
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="landing-workflow">
        <h2>How it works</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">1</span>
            <div>
              <strong>Design</strong>
              <p>Drag elements onto canvas. Set content, style, chart placeholder names.</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-num">2</span>
            <div>
              <strong>Preview</strong>
              <p>Live preview with sample data. Check Outlook warnings before export.</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-num">3</span>
            <div>
              <strong>Export</strong>
              <p>Download HTML (preview) or Copy Template for BigQuery email_list.</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <span className="step-num">4</span>
            <div>
              <strong>Run Engine</strong>
              <p>chart_email_engine_v15.py injects charts and delivers emails.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-footer">
        <button className="landing-cta secondary" onClick={onStart}>
          Open Designer →
        </button>
        <p className="landing-footer-note">
          Right-click on canvas to add elements · Ctrl+Z to undo · Export HTML downloads preview
        </p>
      </div>
    </div>
  );
};
