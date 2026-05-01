# 📧 Outlook Email Template Designer

A React-based drag-and-drop HTML template designer for Outlook emails with live preview, sample data editing, and Outlook-safe HTML export.

## Features

✅ **Drag-and-drop canvas** — Add text, headings, charts, buttons, images, spacers  
✅ **Pixel-perfect positioning** — Grid mode (8px/10px snap) + freeform mode  
✅ **Live preview** — See template render in real-time with sample data  
✅ **Sample data editor** — Mock {{PLACEHOLDER}} values for testing  
✅ **Outlook-safe HTML** — Table-based layouts, inline styles only  
✅ **One-click export** — Download HTML ready to paste into BigQuery  

## Quick Start

```bash
cd template-designer
npm start
```

Browser opens at `http://localhost:3000`

## How to Use

1. **Right-click on canvas** to add elements (text, heading, chart, button, image, spacer)
2. **Drag elements** to position them on canvas
3. **Toggle positioning mode:**
   - **Grid:** Snap to 8px/10px grid (fast alignment)
   - **Freeform:** Pixel-exact dragging (hold for fine control)
4. **Edit properties** in right panel (content, color, font size, etc.)
5. **Add sample data** in "Sample Data" editor (JSON format)
6. **Watch live preview** update as you edit
7. **Export HTML** — Downloads `email-template.html` with `{{PLACEHOLDER}}` preserved

## Element Types

| Type | Usage | Notes |
|------|-------|-------|
| **Text** | Body paragraphs, callouts | Use `{{VAR}}` for variables |
| **Heading** | H1–H3 titles | Supports variables |
| **Chart** | Data visualization placeholder | Config: `{{CHART_NAME}}` |
| **Button** | CTA links | Outlook-safe <a> with inline styles |
| **Image** | Logos, graphics | URL-based, Outlook-compatible |
| **Spacer** | Vertical spacing | Height in pixels |

## Sample Data Format

```json
{
  "USER_NAME": "John Doe",
  "REPORT_DATE": "2026-04-30",
  "SALES_TOTAL": "$125,000"
}
```

In template: `Hello {{USER_NAME}}, here's your report from {{REPORT_DATE}}.`

## Integration with PyViz

1. Build template in designer
2. Export HTML → `email-template.html`
3. Copy HTML content
4. Paste into BigQuery `email_list.html_template` column
5. Run `python chart_email_engine_v15.py` to inject charts

Chart placeholders (`{{CHART_NAME}}`) are preserved during export and replaced with rendered PNG data URIs by the PyViz engine.

## Architecture

- **State:** Zustand (canvas elements, selected element, sample data, mode)
- **Styling:** CSS (no CSS-in-JS, Outlook-safe inline generation)
- **Components:**
  - `Canvas` — drag surface
  - `PropertiesPanel` — edit properties
  - `SampleDataEditor` — JSON editor for test data
  - `LivePreview` — iframe preview
  - `ToolBar` — mode toggle, export, clear
  - `DraggableElement` — individual element with drag handles

## Limitations

- No undo/redo yet (Phase 5 polish)
- No template saving/loading (v1 basic feature)
- Export only (no import/load existing templates)
- One-level nesting only (no complex layout grouping)

## Outlook Compatibility

✅ Table-based layouts (100% Outlook safe)  
✅ Inline styles only (`style="..."`, no `<style>` blocks)  
✅ Arial/Helvetica fonts  
✅ Max-width: 600px (Outlook safe)  
❌ CSS Grid, Flexbox, media queries (not supported)  
❌ CSS animations (not supported)  

Warnings are shown on export if constraints are violated.

## Files

```
src/
├── App.jsx                    # Main app
├── components/
│   ├── Canvas.jsx             # Drag surface
│   ├── DraggableElement.jsx    # Individual element
│   ├── PropertiesPanel.jsx     # Properties editor
│   ├── SampleDataEditor.jsx    # Sample data JSON editor
│   ├── ToolBar.jsx             # Mode toggle + export
│   └── LivePreview.jsx         # iframe preview
├── utils/
│   └── htmlGenerator.js        # Canvas → Outlook HTML
├── store/
│   └── canvasStore.js          # Zustand store
└── styles/
    ├── Canvas.css
    ├── ToolBar.css
    ├── PropertiesPanel.css
    ├── SampleDataEditor.css
    ├── DraggableElement.css
    └── LivePreview.css
```

## Next Steps (Phase 2–5)

- [ ] Undo/redo support
- [ ] Copy/paste elements
- [ ] Save/load templates
- [ ] Template gallery (starter templates)
- [ ] More styling options (margins, borders, shadows)
- [ ] Color theme picker
- [ ] Keyboard shortcuts
