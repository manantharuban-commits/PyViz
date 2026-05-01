import { create } from 'zustand';

export const useCanvasStore = create((set) => ({
  elements: [],
  selectedId: null,
  mode: 'grid', // 'grid' | 'freeform'
  gridSize: 8,
  sampleData: {},
  history: [],
  historyIndex: -1,

  _saveHistory: (state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(JSON.stringify(state.elements));
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  addElement: (element) =>
    set((state) => {
      const newElements = [...state.elements, { id: Date.now(), ...element }];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  updateElement: (id, updates) =>
    set((state) => {
      const newElements = state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  deleteElement: (id) =>
    set((state) => {
      const newElements = state.elements.filter((el) => el.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      return {
        elements: newElements,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  duplicateElement: (id) =>
    set((state) => {
      const element = state.elements.find((el) => el.id === id);
      if (!element) return state;
      const copy = {
        ...element,
        id: Date.now(),
        left: (element.left || 0) + 20,
        top: (element.top || 0) + 20,
      };
      const newElements = [...state.elements, copy];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.stringify(newElements));
      return {
        elements: newElements,
        selectedId: copy.id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  setSelectedId: (id) => set({ selectedId: id }),

  setMode: (mode) => set({ mode }),

  setGridSize: (gridSize) => set({ gridSize }),

  setSampleData: (data) => set({ sampleData: data }),

  updateSampleData: (updates) =>
    set((state) => ({
      sampleData: { ...state.sampleData, ...updates },
    })),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          elements: JSON.parse(state.history[newIndex]),
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          elements: JSON.parse(state.history[newIndex]),
          historyIndex: newIndex,
          selectedId: null,
        };
      }
      return state;
    }),

  canUndo: () => {
    const state = useCanvasStore.getState();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = useCanvasStore.getState();
    return state.historyIndex < state.history.length - 1;
  },

  clearAll: () =>
    set({
      elements: [],
      selectedId: null,
      history: ['[]'],
      historyIndex: 0,
    }),
}));
