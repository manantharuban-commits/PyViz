import React, { useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { DraggableElement } from './DraggableElement';
import '../styles/Canvas.css';

export const Canvas = () => {
  const { elements, selectedId, setSelectedId, addElement } = useCanvasStore();
  const [contextMenu, setContextMenu] = useState(null);

  const handleCanvasClick = () => {
    setSelectedId(null);
    setContextMenu(null);
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const addNewElement = (type) => {
    addElement({
      type,
      left: (contextMenu?.x || 50) - 250, // adjust for canvas position
      top: (contextMenu?.y || 50) - 150,
      width: type === 'spacer' ? 600 : 150,
      height: type === 'spacer' ? 20 : undefined,
      content: type === 'chart' ? '' : `Sample ${type}`,
      chartName: type === 'chart' ? 'CHART_NAME' : undefined,
      bgColor: type === 'button' ? '#0066cc' : undefined,
      text: type === 'button' ? 'Click me' : undefined,
    });
    setContextMenu(null);
  };

  return (
    <div className="canvas-container">
      <div
        className="canvas"
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
      >
        {elements.map((element) => (
          <DraggableElement
            key={element.id}
            element={element}
            isDragging={selectedId === element.id}
          />
        ))}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000,
          }}
        >
          <button onClick={() => addNewElement('text')}>Add Text</button>
          <button onClick={() => addNewElement('heading')}>Add Heading</button>
          <button onClick={() => addNewElement('chart')}>Add Chart</button>
          <button onClick={() => addNewElement('button')}>Add Button</button>
          <button onClick={() => addNewElement('image')}>Add Image</button>
          <button onClick={() => addNewElement('spacer')}>Add Spacer</button>
          <button onClick={() => setContextMenu(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};
