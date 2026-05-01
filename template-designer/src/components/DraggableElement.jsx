import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
import '../styles/DraggableElement.css';

export const DraggableElement = ({ element, isDragging }) => {
  const { setSelectedId, selectedId, updateElement, deleteElement, duplicateElement, mode, gridSize } = useCanvasStore();
  const isSelected = selectedId === element.id;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setSelectedId(element.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = element.left || 0;
    const startTop = element.top || 0;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      // Grid snapping in grid mode
      if (mode === 'grid') {
        newLeft = Math.round(newLeft / gridSize) * gridSize;
        newTop = Math.round(newTop / gridSize) * gridSize;
      }

      updateElement(element.id, { left: newLeft, top: newTop });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteElement(element.id);
  };

  const handleDoubleClick = () => {
    const newContent = prompt('Edit content:', element.content || '');
    if (newContent !== null) {
      updateElement(element.id, { content: newContent });
    }
  };

  const style = {
    position: 'absolute',
    left: `${element.left || 0}px`,
    top: `${element.top || 0}px`,
    width: `${element.width || 150}px`,
    minHeight: '40px',
    padding: '8px',
    border: isSelected ? '2px solid #0066cc' : '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'move',
    userSelect: 'none',
    boxShadow: isSelected ? '0 0 0 3px rgba(0, 102, 204, 0.1)' : 'none',
  };

  const getElementContent = () => {
    switch (element.type) {
      case 'text':
        return `📝 ${element.content || 'Text'}`;
      case 'heading':
        return `📊 ${element.content || 'Heading'}`;
      case 'chart':
        return `📈 {{${element.chartName || 'CHART'}}} (${element.chartType || 'line_altair'})`;
      case 'button':
        return `🔗 ${element.text || 'Button'}`;
      case 'image':
        return `🖼️ Image`;
      case 'spacer':
        return `⬆️ Spacer (${element.height || 20}px)`;
      default:
        return element.type;
    }
  };

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={`draggable-element ${isSelected ? 'selected' : ''}`}
    >
      <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {getElementContent()}
      </div>
      {isSelected && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            width: '24px',
            height: '24px',
            padding: '0',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: '#ff4444',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      )}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            duplicateElement(element.id);
          }}
          style={{
            position: 'absolute',
            top: '-12px',
            right: '18px',
            width: '24px',
            height: '24px',
            padding: '0',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: '#0066cc',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Duplicate"
        >
          ⧉
        </button>
      )}
    </div>
  );
};
