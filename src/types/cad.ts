/**
 * Core Types for 3DMO CAD Application & Plugin System
 */

export type ToolType =
  | 'select'
  | 'line'
  | 'polyline'
  | 'rectangle'
  | 'circle'
  | 'arc'
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'torus'
  | 'extrude'
  | 'revolve'
  | 'boolean_union'
  | 'boolean_difference'
  | 'boolean_intersection'
  | 'fillet'
  | 'chamfer'
  | 'bevel';

export type SelectionMode = 'object' | 'vertex' | 'edge' | 'face';

export interface SelectedSubElement {
  entityId: string;
  subType: 'vertex' | 'edge' | 'face';
  index: number;
  data?: {
    point?: Vector3D;
    edgePoints?: [Vector3D, Vector3D];
    faceNormal?: Vector3D;
    faceVertices?: Vector3D[];
  };
}

export type EntityType = 'curve' | 'solid';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CADEntity {
  id: string;
  name: string;
  type: EntityType;
  subType: string;
  visible: boolean;
  color: string;
  layerId: string;
  parameters: Record<string, any>;
  geometryData?: any; // Native geometry or OCC shape representation
}

export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

export interface SnappingSettings {
  gridSnap: boolean;
  gridSize: number;
  objectSnap: boolean;
  snapEndpoints: boolean;
  snapMidpoints: boolean;
  snapCenter: boolean;
}

// Plugin Architecture Interface
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
}

export interface PluginContext {
  addTool: (tool: { id: string; label: string; iconName?: string; action: () => void }) => void;
  addInspectorPanel: (panel: { id: string; title: string; render: React.ComponentType }) => void;
  registerCommand: (commandId: string, handler: (...args: any[]) => void) => void;
  getEntities: () => CADEntity[];
  addEntity: (entity: Omit<CADEntity, 'id'>) => string;
}

export interface Plugin {
  manifest: PluginManifest;
  activate: (context: PluginContext) => void;
  deactivate?: () => void;
}
