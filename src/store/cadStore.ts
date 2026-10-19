import { create } from 'zustand';
import { CADEntity, Layer, ToolType, SnappingSettings, PluginManifest } from '../types/cad';

interface CADState {
  activeTool: ToolType;
  selectedEntityIds: string[];
  selectedSubElement: { entityId: string; subType: 'face' | 'edge' | 'vertex'; index: number } | null;
  entities: CADEntity[];
  layers: Layer[];
  activeLayerId: string;
  snapping: SnappingSettings;
  activePlugins: PluginManifest[];
  customTools: Array<{ id: string; label: string; iconName?: string; action: () => void }>;
  customInspectorPanels: Array<{ id: string; title: string; render: React.ComponentType }>;
  commands: Record<string, (...args: any[]) => void>;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  selectEntity: (id: string | null, multi?: boolean) => void;
  selectSubElement: (sub: { entityId: string; subType: 'face' | 'edge' | 'vertex'; index: number } | null) => void;
  addEntity: (entity: Omit<CADEntity, 'id'>) => string;
  updateEntityParameters: (id: string, newParams: Record<string, any>) => void;
  deleteEntity: (id: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setSnappingSettings: (settings: Partial<SnappingSettings>) => void;

  // Plugin architecture actions
  addActivePlugin: (manifest: PluginManifest) => void;
  removeActivePlugin: (id: string) => void;
  addCustomTool: (tool: { id: string; label: string; iconName?: string; action: () => void }) => void;
  addCustomInspectorPanel: (panel: { id: string; title: string; render: React.ComponentType }) => void;
  registerCommand: (commandId: string, handler: (...args: any[]) => void) => void;
}

export const useCADStore = create<CADState>((set, get) => ({
  activeTool: 'select',
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
  activePlugins: [],
  customTools: [],
  customInspectorPanels: [],
  commands: {},

  setActiveTool: (tool) => set({ activeTool: tool }),

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

  toggleLayerVisibility: (layerId) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  },

  setSnappingSettings: (settings) => {
    set((state) => ({
      snapping: { ...state.snapping, ...settings },
    }));
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

  addCustomInspectorPanel: (panel) => {
    set((state) => ({ customInspectorPanels: [...state.customInspectorPanels, panel] }));
  },

  registerCommand: (commandId, handler) => {
    set((state) => ({ commands: { ...state.commands, [commandId]: handler } }));
  },
}));
