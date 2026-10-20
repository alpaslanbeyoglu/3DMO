import { create } from 'zustand';
import { CADEntity, Layer, ToolType, SnappingSettings, PluginManifest, SelectionMode, SelectedSubElement } from '../types/cad';

interface CADState {
  activeTool: ToolType;
  selectionMode: SelectionMode;
  selectedEntityIds: string[];
  selectedSubElement: SelectedSubElement | null;
  entities: CADEntity[];
  layers: Layer[];
  activeLayerId: string;
  snapping: SnappingSettings;
  activePlugins: PluginManifest[];
  customTools: Array<{ id: string; label: string; iconName?: string; action: () => void }>;
  customInspectorPanels: Array<{ id: string; title: string; render: React.ComponentType }>;
  commands: Record<string, (...args: any[]) => void>;

  cursorCoords: { x: number; y: number; z: number };

  // Actions
  setActiveTool: (tool: ToolType) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setCursorCoords: (coords: { x: number; y: number; z: number }) => void;
  selectEntity: (id: string | null, multi?: boolean) => void;
  selectSubElement: (sub: SelectedSubElement | null) => void;
  addEntity: (entity: Omit<CADEntity, 'id'>) => string;
  updateEntityParameters: (id: string, newParams: Record<string, any>) => void;
  deleteEntity: (id: string) => void;
  duplicateEntity: (id: string) => void;
  addLayer: (name: string, color?: string) => void;
  removeLayer: (id: string) => void;
  setActiveLayerId: (id: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setSnappingSettings: (settings: Partial<SnappingSettings>) => void;
  loadProject: (entities: CADEntity[], layers: Layer[]) => void;
  clearAll: () => void;

  // Plugin architecture actions
  addActivePlugin: (manifest: PluginManifest) => void;
  removeActivePlugin: (id: string) => void;
  addCustomTool: (tool: { id: string; label: string; iconName?: string; action: () => void }) => void;
  removeCustomTool: (id: string) => void;
  addCustomInspectorPanel: (panel: { id: string; title: string; render: React.ComponentType }) => void;
  registerCommand: (commandId: string, handler: (...args: any[]) => void) => void;
}

export const useCADStore = create<CADState>((set, get) => ({
  activeTool: 'select',
  selectionMode: 'object',
  selectedEntityIds: [],
  selectedSubElement: null,
  entities: [
    {
      id: 'box-demo-1',
      name: 'Box 1',
      type: 'solid',
      subType: 'box',
      visible: true,
      color: '#3b82f6',
      layerId: 'default',
      parameters: { width: 10, height: 10, depth: 10, posX: 0, posY: 0, posZ: 0 },
    },
  ],
  layers: [
    { id: 'default', name: 'Default Layer', color: '#3b82f6', visible: true, locked: false },
    { id: 'construction', name: 'Construction', color: '#10b981', visible: true, locked: false },
  ],
  activeLayerId: 'default',
  snapping: {
    gridSnap: true,
    gridSize: 1.0,
    objectSnap: true,
    snapEndpoints: true,
    snapMidpoints: true,
    snapCenter: true,
  },
  cursorCoords: { x: 0, y: 0, z: 0 },
  activePlugins: [],
  customTools: [],
  customInspectorPanels: [],
  commands: {},

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),

  setCursorCoords: (coords) => set({ cursorCoords: coords }),

  selectEntity: (id, multi = false) => {
    if (!id) {
      set({ selectedEntityIds: [], selectedSubElement: null });
      return;
    }
    set((state) => {
      if (multi) {
        const exists = state.selectedEntityIds.includes(id);
        return {
          selectedEntityIds: exists
            ? state.selectedEntityIds.filter((item) => item !== id)
            : [...state.selectedEntityIds, id],
        };
      }
      return { selectedEntityIds: [id], selectedSubElement: null };
    });
  },

  selectSubElement: (sub) => set({ selectedSubElement: sub }),

  addEntity: (entityData) => {
    const id = `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEntity: CADEntity = {
      ...entityData,
      id,
    };
    set((state) => ({
      entities: [...state.entities, newEntity],
      selectedEntityIds: [id],
    }));
    return id;
  },

  updateEntityParameters: (id, newParams) => {
    set((state) => ({
      entities: state.entities.map((ent) =>
        ent.id === id
          ? { ...ent, parameters: { ...ent.parameters, ...newParams } }
          : ent
      ),
    }));
  },

  deleteEntity: (id) => {
    set((state) => ({
      entities: state.entities.filter((ent) => ent.id !== id),
      selectedEntityIds: state.selectedEntityIds.filter((entId) => entId !== id),
    }));
  },

  duplicateEntity: (id) => {
    const state = get();
    const source = state.entities.find((e) => e.id === id);
    if (!source) return;
    const newId = `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const clone: CADEntity = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      parameters: {
        ...source.parameters,
        posX: (source.parameters.posX ?? 0) + 5,
        posY: source.parameters.posY ?? 0,
        posZ: (source.parameters.posZ ?? 0) + 5,
      },
    };
    set((s) => ({
      entities: [...s.entities, clone],
      selectedEntityIds: [newId],
    }));
  },

  addLayer: (name, color = '#60a5fa') => {
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = { id, name, color, visible: true, locked: false };
    set((state) => ({
      layers: [...state.layers, newLayer],
      activeLayerId: id,
    }));
  },

  removeLayer: (id) => {
    if (id === 'default') return; // Cannot delete default layer
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: state.activeLayerId === id ? 'default' : state.activeLayerId,
      entities: state.entities.map((e) => e.layerId === id ? { ...e, layerId: 'default' } : e),
    }));
  },

  setActiveLayerId: (id) => set({ activeLayerId: id }),

  toggleLayerVisibility: (layerId) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  },

  toggleLayerLock: (layerId) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      ),
    }));
  },

  setSnappingSettings: (settings) => {
    set((state) => ({
      snapping: { ...state.snapping, ...settings },
    }));
  },

  loadProject: (entities, layers) => {
    set({
      entities,
      layers: layers.length > 0 ? layers : [
        { id: 'default', name: 'Default Layer', color: '#3b82f6', visible: true, locked: false }
      ],
      selectedEntityIds: entities.length > 0 ? [entities[0].id] : [],
      selectedSubElement: null,
    });
  },

  clearAll: () => {
    set({
      entities: [],
      selectedEntityIds: [],
      selectedSubElement: null,
    });
  },

  addActivePlugin: (manifest) => {
    set((state) => ({ activePlugins: [...state.activePlugins, manifest] }));
  },

  removeActivePlugin: (id) => {
    set((state) => ({
      activePlugins: state.activePlugins.filter((p) => p.id !== id),
    }));
  },

  addCustomTool: (tool) => {
    set((state) => ({ customTools: [...state.customTools, tool] }));
  },

  removeCustomTool: (id) => {
    set((state) => ({ customTools: state.customTools.filter((t) => t.id !== id) }));
  },

  addCustomInspectorPanel: (panel) => {
    set((state) => ({ customInspectorPanels: [...state.customInspectorPanels, panel] }));
  },

  registerCommand: (commandId, handler) => {
    set((state) => ({ commands: { ...state.commands, [commandId]: handler } }));
  },
}));
