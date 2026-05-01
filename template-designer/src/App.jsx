import React, { useState, useEffect } from 'react';
import './App.css';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SampleDataEditor } from './components/SampleDataEditor';
import { LivePreview } from './components/LivePreview';
import { ToolBar } from './components/ToolBar';
import { LandingPage } from './components/LandingPage';
import { useCanvasStore } from './store/canvasStore';

function Designer() {
  const { undo, redo, selectedId, deleteElement, duplicateElement, updateElement, gridSize } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      if (!selectedId || inInput) return;

      const element = useCanvasStore.getState().elements.find((el) => el.id === selectedId);
      if (!element) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateElement(selectedId);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        updateElement(selectedId, { fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); updateElement(selectedId, { align: 'left' }); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); updateElement(selectedId, { align: 'center' }); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') { e.preventDefault(); updateElement(selectedId, { align: 'right' }); return; }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = gridSize || 8;
        updateElement(selectedId, {
          left: (element.left || 0) + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0),
          top: (element.top || 0) + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0),
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, deleteElement, duplicateElement, updateElement, gridSize]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>📧 Outlook Email Template Designer</h1>
        <p>Drag &amp; drop to build · Export Outlook-safe HTML · BigQuery ready</p>
      </header>
      <ToolBar />
      <div className="app-content">
        <div className="workspace">
          <div className="canvas-section">
            <Canvas />
          </div>
          <PropertiesPanel />
        </div>
        <div className="right-panel">
          <SampleDataEditor />
          <LivePreview />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('landing');

  return page === 'landing'
    ? <LandingPage onStart={() => setPage('designer')} />
    : <Designer />;
}

export default App;
