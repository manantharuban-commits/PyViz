import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import '../styles/PropertiesPanel.css';

const getElementWarnings = (element) => {
  const warnings = [];
  if ((element.width || 150) > 600)
    warnings.push('Width exceeds 600px email limit — Outlook will clip');
  if (element.type === 'chart' && !element.chartName)
    warnings.push('Chart placeholder name required (e.g. SALES_CHART)');
  if (element.type === 'button' && !element.url)
    warnings.push('Button has no URL — link will be dead');
  if (element.type === 'button' && element.bgColor)
    warnings.push('Button bg color needs VML fallback for Outlook 2013–2019');
  if (element.type === 'image' && !element.src)
    warnings.push('Image has no source URL');
  if (element.type === 'image' && !element.alt)
    warnings.push('Missing alt text — accessibility and Outlook broken-image fallback');
  return warnings;
};

const SectionHeader = ({ label }) => (
  <div className="prop-section-header">{label}</div>
);

export const PropertiesPanel = () => {
  const { selectedId, elements, updateElement, deleteElement, duplicateElement } = useCanvasStore();

  const element = elements.find((el) => el.id === selectedId);

  if (!element) {
    return (
      <div className="properties-panel empty">
        <div>
          <div>Select an element to edit</div>
          <div className="shortcut-hint">Right-click canvas to add elements</div>
        </div>
      </div>
    );
  }

  const handleUpdate = (key, value) => updateElement(element.id, { [key]: value });
  const warnings = getElementWarnings(element);

  return (
    <div className="properties-panel">
      <div className="prop-panel-header">
        <h3>{element.type.charAt(0).toUpperCase() + element.type.slice(1)}</h3>
        <div className="prop-actions">
          <button
            className="prop-action-btn"
            onClick={() => duplicateElement(element.id)}
            title="Duplicate (Ctrl+D)"
          >
            ⧉
          </button>
          <button
            className="prop-action-btn danger"
            onClick={() => deleteElement(element.id)}
            title="Delete (Del)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── WARNINGS ── */}
      {warnings.length > 0 && (
        <div className="prop-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="prop-warning">⚠ {w}</div>
          ))}
        </div>
      )}

      {/* ── CONTENT ── */}
      <SectionHeader label="Content" />

      {(element.type === 'text' || element.type === 'heading') && (
        <div className="prop-group">
          <label>Text</label>
          <textarea
            value={element.content || ''}
            onChange={(e) => handleUpdate('content', e.target.value)}
            placeholder="Enter text or use {{PLACEHOLDER}}"
          />
        </div>
      )}

      {element.type === 'chart' && (
        <>
          <div className="prop-group">
            <label>Placeholder name</label>
            <input
              type="text"
              value={element.chartName || ''}
              onChange={(e) => handleUpdate('chartName', e.target.value)}
              placeholder="e.g. SALES_CHART"
            />
          </div>
          <div className="prop-group">
            <label>Chart type (hint)</label>
            <select
              value={element.chartType || 'line_altair'}
              onChange={(e) => handleUpdate('chartType', e.target.value)}
            >
              <option value="line_altair">Line</option>
              <option value="bar_altair">Bar</option>
              <option value="area_altair">Area</option>
              <option value="scatter_altair">Scatter</option>
              <option value="arc_altair">Pie / Donut</option>
              <option value="heatmap_altair">Heatmap</option>
              <option value="strip_altair">Strip</option>
              <option value="boxplot_altair">Boxplot</option>
            </select>
          </div>
        </>
      )}

      {element.type === 'button' && (
        <>
          <div className="prop-group">
            <label>Button text</label>
            <input
              type="text"
              value={element.text || ''}
              onChange={(e) => handleUpdate('text', e.target.value)}
            />
          </div>
          <div className="prop-group">
            <label>URL</label>
            <input
              type="text"
              value={element.url || ''}
              onChange={(e) => handleUpdate('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {element.type === 'image' && (
        <>
          <div className="prop-group">
            <label>Image URL</label>
            <input
              type="text"
              value={element.src || ''}
              onChange={(e) => handleUpdate('src', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="prop-group">
            <label>Alt text</label>
            <input
              type="text"
              value={element.alt || ''}
              onChange={(e) => handleUpdate('alt', e.target.value)}
            />
          </div>
        </>
      )}

      {element.type === 'spacer' && (
        <div className="prop-group">
          <label>Height (px)</label>
          <input
            type="number"
            value={element.height || 20}
            onChange={(e) => handleUpdate('height', Number(e.target.value))}
            min="0"
          />
        </div>
      )}

      {/* ── STYLE ── */}
      <SectionHeader label="Style" />

      <div className="prop-row">
        <div className="prop-group">
          <label>Width (px)</label>
          <input
            type="number"
            value={element.width || 150}
            onChange={(e) => handleUpdate('width', Number(e.target.value))}
            min="50"
          />
        </div>
        {element.type === 'image' && (
          <div className="prop-group">
            <label>Img height</label>
            <input
              type="number"
              value={element.imgHeight || ''}
              onChange={(e) => handleUpdate('imgHeight', e.target.value ? Number(e.target.value) : 'auto')}
              placeholder="auto"
            />
          </div>
        )}
      </div>

      {element.type !== 'spacer' && (
        <>
          <div className="prop-row">
            <div className="prop-group">
              <label>Font size (px)</label>
              <input
                type="number"
                value={element.fontSize || 14}
                onChange={(e) => handleUpdate('fontSize', Number(e.target.value))}
                min="8"
                max="72"
              />
            </div>
            <div className="prop-group">
              <label>Line height</label>
              <input
                type="number"
                value={element.lineHeight || 1.5}
                onChange={(e) => handleUpdate('lineHeight', Number(e.target.value))}
                min="1"
                max="3"
                step="0.1"
              />
            </div>
          </div>

          <div className="prop-row">
            <div className="prop-group">
              <label>Text color</label>
              <input
                type="color"
                value={element.type === 'button' ? (element.buttonTextColor || '#ffffff') : (element.color || '#333333')}
                onChange={(e) =>
                  handleUpdate(element.type === 'button' ? 'buttonTextColor' : 'color', e.target.value)
                }
              />
            </div>
            <div className="prop-group">
              <label>Bg color</label>
              <input
                type="color"
                value={element.bgColor || '#ffffff'}
                onChange={(e) => handleUpdate('bgColor', e.target.value)}
              />
            </div>
          </div>

          <div className="prop-group">
            <label>Align</label>
            <div className="align-buttons">
              {['left', 'center', 'right'].map((a) => (
                <button
                  key={a}
                  className={`align-btn ${(element.align || 'left') === a ? 'active' : ''}`}
                  onClick={() => handleUpdate('align', a)}
                  title={`Align ${a} (Ctrl+${a === 'left' ? 'L' : a === 'center' ? 'E' : 'R'})`}
                >
                  {a === 'left' ? '⬤ ·· ·' : a === 'center' ? '· ⬤ ·' : '· ·· ⬤'}
                </button>
              ))}
            </div>
          </div>

          <div className="prop-row">
            <div className="prop-group">
              <label>Padding (px)</label>
              <input
                type="number"
                value={element.padding || 15}
                onChange={(e) => handleUpdate('padding', Number(e.target.value))}
                min="0"
              />
            </div>
            {element.type === 'button' && (
              <div className="prop-group">
                <label>Btn padding</label>
                <input
                  type="number"
                  value={element.buttonPadding || 10}
                  onChange={(e) => handleUpdate('buttonPadding', Number(e.target.value))}
                  min="0"
                />
              </div>
            )}
          </div>

          <div className="prop-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={element.fontWeight === 'bold'}
                onChange={(e) => handleUpdate('fontWeight', e.target.checked ? 'bold' : 'normal')}
              />
              Bold (Ctrl+B)
            </label>
          </div>
        </>
      )}

      {/* ── POSITION ── */}
      <SectionHeader label="Position" />
      <div className="prop-row">
        <div className="prop-group">
          <label>Left (px)</label>
          <input
            type="number"
            value={Math.round(element.left || 0)}
            onChange={(e) => handleUpdate('left', Number(e.target.value))}
          />
        </div>
        <div className="prop-group">
          <label>Top (px)</label>
          <input
            type="number"
            value={Math.round(element.top || 0)}
            onChange={(e) => handleUpdate('top', Number(e.target.value))}
          />
        </div>
      </div>

      {/* ── KEYBOARD SHORTCUTS ── */}
      <SectionHeader label="Shortcuts" />
      <div className="shortcut-grid">
        <span className="shortcut-key">Del</span><span>Delete element</span>
        <span className="shortcut-key">Ctrl+D</span><span>Duplicate</span>
        <span className="shortcut-key">Ctrl+B</span><span>Bold</span>
        <span className="shortcut-key">Ctrl+L</span><span>Align left</span>
        <span className="shortcut-key">Ctrl+E</span><span>Align center</span>
        <span className="shortcut-key">Ctrl+R</span><span>Align right</span>
        <span className="shortcut-key">↑↓←→</span><span>Nudge position</span>
        <span className="shortcut-key">Ctrl+Z</span><span>Undo</span>
        <span className="shortcut-key">Ctrl+Y</span><span>Redo</span>
      </div>
    </div>
  );
};
