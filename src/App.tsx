import React, { useState, useRef } from 'react';
import { ViewportGrid } from './components/ViewportGrid';
import { ParametricInspectorModal } from './components/ParametricInspectorModal';
import { LayerManagerPanel } from './components/LayerManagerPanel';
import { PluginManagerModal } from './components/PluginManagerModal';
import { useCADStore } from './store/cadStore';
import { exportProjectJSON, exportToSTL, exportToSTEP, importProjectJSON } from './utils/exportImport';
import {
  performExtrude,
  performRevolve,
  performBooleanOperation,
  performFillet,
  performChamfer,
  performBevel,
} from './cad/operations';
import { create2DCurveEntity, createTorusEntity } from './cad/primitiveFactory';
import { SelectionMode } from './types/cad';
import {
  Box,
  Circle,
  Cylinder,
  Minus,
  Move,
  Grid,
  Package,
  Wrench,
  Puzzle,
  Download,
  Upload,
  Sparkles,
  Dot,
  Square,
  Slash,
  Maximize2,
  RotateCw,
  Scissors,
  Check,
  X,
  Plus,
} from 'lucide-react';

export const App: React.FC = () => {
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CAD Store
  const activeTool = useCADStore((state) => state.activeTool);
  const setActiveTool = useCADStore((state) => state.setActiveTool);
  const selectionMode = useCADStore((state) => state.selectionMode);
  const setSelectionMode = useCADStore((state) => state.setSelectionMode);
  const selectedEntityIds = useCADStore((state) => state.selectedEntityIds);
  const selectedSubElement = useCADStore((state) => state.selectedSubElement);
  const snapping = useCADStore((state) => state.snapping);
  const setSnappingSettings = useCADStore((state) => state.setSnappingSettings);
  const addEntity = useCADStore((state) => state.addEntity);
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const deleteEntity = useCADStore((state) => state.deleteEntity);
  const entities = useCADStore((state) => state.entities);
  const layers = useCADStore((state) => state.layers);
  const customTools = useCADStore((state) => state.customTools);
  const cursorCoords = useCADStore((state) => state.cursorCoords);
  const loadProject = useCADStore((state) => state.loadProject);

  // Construct Options States
  const [extrudeDist, setExtrudeDist] = useState<number>(10);
  const [extrudeBevelEnabled, setExtrudeBevelEnabled] = useState<boolean>(true);
  const [extrudeBevelSize, setExtrudeBevelSize] = useState<number>(0.8);
  const [revolveAngle, setRevolveAngle] = useState<number>(360);
  const [bevelSize, setBevelSize] = useState<number>(1.5);
  const [bevelSegments, setBevelSegments] = useState<number>(3);
  const [filletRadius, setFilletRadius] = useState<number>(2.0);
  const [chamferDist, setChamferDist] = useState<number>(2.0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Solid Primitives Handlers
  const handleAddBox = () => {
    addEntity({
      name: 'Box Primitive',
      type: 'solid',
      subType: 'box',
      visible: true,
      color: '#3b82f6',
      layerId: 'default',
      parameters: { width: 10, height: 10, depth: 10, posX: 0, posY: 0, posZ: 0 },
    });
    showNotification('Box Primitive Added');
  };

  const handleAddCylinder = () => {
    addEntity({
      name: 'Cylinder Primitive',
      type: 'solid',
      subType: 'cylinder',
      visible: true,
      color: '#10b981',
      layerId: 'default',
      parameters: { radius: 5, height: 12, posX: 0, posY: 0, posZ: 0 },
    });
    showNotification('Cylinder Primitive Added');
  };

  const handleAddSphere = () => {
    addEntity({
      name: 'Sphere Primitive',
      type: 'solid',
      subType: 'sphere',
      visible: true,
      color: '#f59e0b',
      layerId: 'default',
      parameters: { radius: 6, posX: 0, posY: 0, posZ: 0 },
    });
    showNotification('Sphere Primitive Added');
  };

  const handleAddCone = () => {
    addEntity({
      name: 'Cone Primitive',
      type: 'solid',
      subType: 'cone',
      visible: true,
      color: '#ec4899',
      layerId: 'default',
      parameters: { radius: 5, height: 10, posX: 0, posY: 0, posZ: 0 },
    });
    showNotification('Cone Primitive Added');
  };

  const handleAddTorus = () => {
    addEntity(createTorusEntity({ radius: 6, tube: 2 }));
    showNotification('Torus Primitive Added');
  };

  // Quick Curve Presets Handlers
  const handleAddQuickLine = () => {
    addEntity(
      create2DCurveEntity('line', {
        points: [
          { x: -10, y: 0, z: 0 },
          { x: 10, y: 0, z: 0 },
        ],
        closed: false,
      })
    );
    showNotification('Line Curve Added');
  };

  const handleAddQuickCircle = () => {
    addEntity(
      create2DCurveEntity('circle', {
        points: [{ x: 0, y: 0, z: 0 }],
        radius: 6,
        closed: true,
      })
    );
    showNotification('Circle Curve Added');
  };

  const handleAddQuickRect = () => {
    addEntity(
      create2DCurveEntity('rectangle', {
        points: [
          { x: -7, y: 0, z: -5 },
          { x: 7, y: 0, z: -5 },
          { x: 7, y: 0, z: 5 },
          { x: -7, y: 0, z: 5 },
        ],
        closed: true,
        width: 14,
        height: 10,
      })
    );
    showNotification('Rectangle Curve Added');
  };

  // Construct & Edit Execution Handlers
  const handleApplyExtrude = () => {
    if (selectedEntityIds.length === 0) {
      showNotification('Please select a curve or solid to extrude.');
      return;
    }
    const target = entities.find((e) => e.id === selectedEntityIds[selectedEntityIds.length - 1]);
    if (!target) return;

    const extruded = performExtrude(target, {
      distance: extrudeDist,
      bevelEnabled: extrudeBevelEnabled,
      bevelSize: extrudeBevelSize,
      bevelSegments: 2,
    });
    addEntity(extruded);
    setActiveTool('select');
    showNotification(`Extruded ${target.name} (${extrudeDist}mm)`);
  };

  const handleApplyRevolve = () => {
    if (selectedEntityIds.length === 0) {
      showNotification('Please select a curve or solid to revolve.');
      return;
    }
    const target = entities.find((e) => e.id === selectedEntityIds[selectedEntityIds.length - 1]);
    if (!target) return;

    const revolved = performRevolve(target, revolveAngle);
    addEntity(revolved);
    setActiveTool('select');
    showNotification(`Revolved ${target.name} (${revolveAngle}°)`);
  };

  const handleApplyBevel = () => {
    if (selectedEntityIds.length === 0) {
      showNotification('Please select a solid to bevel.');
      return;
    }
    const targetId = selectedEntityIds[selectedEntityIds.length - 1];
    const target = entities.find((e) => e.id === targetId);
    if (!target) return;

    const beveled = performBevel(target, bevelSize, bevelSegments);
    updateEntityParameters(targetId, beveled.parameters);
    setActiveTool('select');
    showNotification(`Beveled ${target.name} (${bevelSize}mm)`);
  };

  const handleApplyFillet = () => {
    if (selectedEntityIds.length === 0) {
      showNotification('Please select a solid to fillet.');
      return;
    }
    const targetId = selectedEntityIds[selectedEntityIds.length - 1];
    const target = entities.find((e) => e.id === targetId);
    if (!target) return;

    const filleted = performFillet(target, filletRadius);
    updateEntityParameters(targetId, filleted.parameters);
    setActiveTool('select');
    showNotification(`Filleted ${target.name} (R${filletRadius})`);
  };

  const handleApplyChamfer = () => {
    if (selectedEntityIds.length === 0) {
      showNotification('Please select a solid to chamfer.');
      return;
    }
    const targetId = selectedEntityIds[selectedEntityIds.length - 1];
    const target = entities.find((e) => e.id === targetId);
    if (!target) return;

    const chamfered = performChamfer(target, chamferDist);
    updateEntityParameters(targetId, chamfered.parameters);
    setActiveTool('select');
    showNotification(`Chamfered ${target.name} (${chamferDist}mm)`);
  };

  const handleApplyBoolean = (opType: 'union' | 'difference' | 'intersection') => {
    if (selectedEntityIds.length < 2) {
      showNotification('Please select at least 2 solids (hold Shift to multi-select).');
      return;
    }
    const entA = entities.find((e) => e.id === selectedEntityIds[0]);
    const entB = entities.find((e) => e.id === selectedEntityIds[1]);
    if (!entA || !entB) return;

    const result = performBooleanOperation(entA, entB, opType);
    addEntity(result);
    // Optionally hide original operands
    updateEntityParameters(entA.id, { visible: false });
    updateEntityParameters(entB.id, { visible: false });
    setActiveTool('select');
    showNotification(`Boolean ${opType.toUpperCase()} performed successfully!`);
  };

  // Import file handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importProjectJSON(
      file,
      (importedEntities, importedLayers) => {
        loadProject(importedEntities, importedLayers);
        showNotification('Project loaded successfully!');
      },
      (err) => showNotification(`Error loading file: ${err}`)
    );
  };

  const isConstructTool = [
    'extrude',
    'revolve',
    'boolean_union',
    'boolean_difference',
    'boolean_intersection',
    'fillet',
    'chamfer',
    'bevel',
  ].includes(activeTool);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-gray-200 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-12 bg-gray-850 bg-[#1c1e24] border-b border-gray-700/80 flex items-center justify-between px-4 select-none shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-blue-400 text-lg tracking-wider">
            <Package className="w-6 h-6 text-blue-500" />
            <span>3DMO</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            CAD Studio
          </span>
        </div>

        {/* Center: Selection Modes Switcher (Nokta/Vertex, Çizgi/Edge, Yüzey/Face, Nesne/Object) */}
        <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-lg border border-gray-700/80 shadow-inner">
          <span className="text-[10px] uppercase font-semibold text-gray-400 px-1.5 hidden sm:inline">
            Mod:
          </span>
          <button
            onClick={() => setSelectionMode('object')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-medium ${
              selectionMode === 'object'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Nesne Modu (Entire Solid / Curve)"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Nesne (Object)</span>
          </button>
          <button
            onClick={() => setSelectionMode('vertex')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-medium ${
              selectionMode === 'vertex'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Nokta Modu (Vertex Points)"
          >
            <Dot className="w-4 h-4 text-cyan-400" />
            <span>Nokta (Vertex)</span>
          </button>
          <button
            onClick={() => setSelectionMode('edge')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-medium ${
              selectionMode === 'edge'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Kenar / Çizgi Modu (Edge Segments)"
          >
            <Slash className="w-3.5 h-3.5 text-amber-400" />
            <span>Kenar (Edge)</span>
          </button>
          <button
            onClick={() => setSelectionMode('face')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-medium ${
              selectionMode === 'face'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Yüzey Modu (Faces & Polygons)"
          >
            <Square className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yüzey (Face)</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Import / Export Menu */}
          <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded border border-gray-700 text-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".moi3d,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
              title="Import .MOI3D / JSON CAD file"
            >
              <Upload className="w-3 h-3 text-emerald-400" />
              <span>Import</span>
            </button>
            <button
              onClick={() => exportProjectJSON(entities, layers)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
              title="Export as native project file"
            >
              <Download className="w-3 h-3 text-blue-400" />
              <span>.MOI3D</span>
            </button>
            <button
              onClick={() => exportToSTL(entities)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
              title="Export 3D printable STL"
            >
              <span>STL</span>
            </button>
            <button
              onClick={() => exportToSTEP(entities)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
              title="Export standard STEP AP214 CAD file"
            >
              <span>STEP</span>
            </button>
          </div>

          {/* Plugin Manager Toggle */}
          <button
            onClick={() => setIsPluginModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40 rounded text-xs transition-colors font-medium"
          >
            <Puzzle className="w-3.5 h-3.5 text-purple-400" />
            <span>Plugins</span>
          </button>

          {/* Snapping Controls */}
          <div className="flex items-center gap-3 text-xs pl-3 border-l border-gray-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={snapping.gridSnap}
                onChange={(e) => setSnappingSettings({ gridSnap: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <Grid className="w-3.5 h-3.5 text-blue-400" />
              <span>Grid</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={snapping.objectSnap}
                onChange={(e) => setSnappingSettings({ objectSnap: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <Move className="w-3.5 h-3.5 text-green-400" />
              <span>Snap</span>
            </label>
          </div>
        </div>
      </header>

      {/* Main CAD Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar (MOI 3D Draw & Construct Command Panels) */}
        <aside className="w-64 bg-[#181a1f] border-r border-gray-700/80 flex flex-col p-3 gap-3.5 overflow-y-auto shrink-0 select-none z-10 shadow-lg">
          {/* Layer Manager Panel */}
          <LayerManagerPanel />

          {/* Plugins Custom Tools Section */}
          {customTools.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center gap-1.5">
                <Puzzle className="w-3.5 h-3.5 text-purple-400" />
                Plugin Tools
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {customTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-purple-950/40 border border-purple-500/40 rounded text-purple-200 hover:bg-purple-900/60 transition-colors text-left font-medium"
                  >
                    <span>✦ {tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Draw Curve Section (Çizim) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Circle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Draw Curve (Çizim)</span>
              </h3>
            </div>

            {/* Interactive Drawing Click Tools */}
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <button
                onClick={() => setActiveTool(activeTool === 'line' ? 'select' : 'line')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'line'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title="Click 2 points on viewport grid to draw line"
              >
                <Minus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Line</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'polyline' ? 'select' : 'polyline')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'polyline'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title="Click sequential points to draw polyline"
              >
                <Minus className="w-3.5 h-3.5 rotate-45 text-cyan-400" />
                <span>Polyline</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'circle' ? 'select' : 'circle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'circle'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title="Click center & radius to draw circle"
              >
                <Circle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'rectangle' ? 'select' : 'rectangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'rectangle'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title="Click 2 opposite corners to draw rectangle"
              >
                <Square className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rectangle</span>
              </button>
            </div>

            {/* Quick Curve Presets */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-800 text-[10px]">
              <button
                onClick={handleAddQuickLine}
                className="py-1 px-1.5 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-cyan-300 rounded border border-gray-800 text-center truncate"
              >
                + Quick Line
              </button>
              <button
                onClick={handleAddQuickCircle}
                className="py-1 px-1.5 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-cyan-300 rounded border border-gray-800 text-center truncate"
              >
                + Quick Circle
              </button>
              <button
                onClick={handleAddQuickRect}
                className="py-1 px-1.5 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-cyan-300 rounded border border-gray-800 text-center truncate"
              >
                + Quick Rect
              </button>
            </div>
          </div>

          {/* Draw Solid Primitives Section */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              Draw Solid (Katı)
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleAddBox}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-800/80 border border-gray-700/70 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Box</span>
              </button>
              <button
                onClick={handleAddCylinder}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-800/80 border border-gray-700/70 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Cylinder className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Cylinder</span>
              </button>
              <button
                onClick={handleAddSphere}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-800/80 border border-gray-700/70 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Circle className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Sphere</span>
              </button>
              <button
                onClick={handleAddCone}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-800/80 border border-gray-700/70 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-pink-400" />
                <span>+ Cone</span>
              </button>
              <button
                onClick={handleAddTorus}
                className="col-span-2 flex items-center justify-center gap-2 px-2.5 py-1.5 text-xs bg-gray-800/80 border border-gray-700/70 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-center transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>+ Torus Primitive</span>
              </button>
            </div>
          </div>

          {/* Construct / Modeling Operations Section (Construct & Edit) */}
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-green-400" />
              Construct & Edit
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTool(activeTool === 'extrude' ? 'select' : 'extrude')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'extrude'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extrude</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'revolve' ? 'select' : 'revolve')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'revolve'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
                <span>Revolve</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'boolean_union' ? 'select' : 'boolean_union')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool.startsWith('boolean')
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-red-400" />
                <span>Boolean</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'bevel' ? 'select' : 'bevel')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'bevel'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title="Bevel Edges / Faces"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Bevel</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'fillet' ? 'select' : 'fillet')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'fillet'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Circle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fillet</span>
              </button>
              <button
                onClick={() => setActiveTool(activeTool === 'chamfer' ? 'select' : 'chamfer')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'chamfer'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium ring-1 ring-blue-400'
                    : 'bg-gray-800/80 border-gray-700/70 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Slash className="w-3.5 h-3.5 text-yellow-400" />
                <span>Chamfer</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center 4-Viewport Container with MoI 3D Command Bar Overlay */}
        <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
          {/* Active Command Bar (Interactive MoI 3D style Construct Prompt) */}
          {isConstructTool && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-gray-900/95 backdrop-blur-md border border-blue-500/50 shadow-2xl rounded-xl px-4 py-2 flex items-center gap-4 text-xs text-gray-200 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Extrude Command Bar */}
              {activeTool === 'extrude' && (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>Extrude</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Distance:</label>
                    <input
                      type="number"
                      step="1"
                      value={extrudeDist}
                      onChange={(e) => setExtrudeDist(parseFloat(e.target.value) || 1)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-emerald-300"
                    />
                    <span className="text-gray-500">mm</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={extrudeBevelEnabled}
                      onChange={(e) => setExtrudeBevelEnabled(e.target.checked)}
                      className="accent-blue-500 rounded"
                    />
                    <span>Bevel</span>
                  </label>
                  {extrudeBevelEnabled && (
                    <input
                      type="number"
                      step="0.2"
                      value={extrudeBevelSize}
                      onChange={(e) => setExtrudeBevelSize(parseFloat(e.target.value) || 0.5)}
                      className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-right font-mono text-purple-300"
                    />
                  )}
                  <button
                    onClick={handleApplyExtrude}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Revolve Command Bar */}
              {activeTool === 'revolve' && (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-purple-400 flex items-center gap-1.5">
                    <RotateCw className="w-4 h-4" />
                    <span>Revolve</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Angle:</label>
                    <input
                      type="number"
                      step="15"
                      value={revolveAngle}
                      onChange={(e) => setRevolveAngle(parseFloat(e.target.value) || 360)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-purple-300"
                    />
                    <span className="text-gray-500">°</span>
                  </div>
                  <button
                    onClick={handleApplyRevolve}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bevel Command Bar */}
              {activeTool === 'bevel' && (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Bevel</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Size:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={bevelSize}
                      onChange={(e) => setBevelSize(parseFloat(e.target.value) || 1)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-amber-300"
                    />
                    <span className="text-gray-500">mm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Segments:</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="8"
                      value={bevelSegments}
                      onChange={(e) => setBevelSegments(parseInt(e.target.value) || 2)}
                      className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-amber-300"
                    />
                  </div>
                  <button
                    onClick={handleApplyBevel}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Fillet Command Bar */}
              {activeTool === 'fillet' && (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Circle className="w-4 h-4" />
                    <span>Fillet</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Radius:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={filletRadius}
                      onChange={(e) => setFilletRadius(parseFloat(e.target.value) || 1)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-cyan-300"
                    />
                    <span className="text-gray-500">mm</span>
                  </div>
                  <button
                    onClick={handleApplyFillet}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chamfer Command Bar */}
              {activeTool === 'chamfer' && (
                <div className="flex items-center gap-3">
                  <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                    <Slash className="w-4 h-4" />
                    <span>Chamfer</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-400">Distance:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={chamferDist}
                      onChange={(e) => setChamferDist(parseFloat(e.target.value) || 1)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-right font-mono text-yellow-300"
                    />
                    <span className="text-gray-500">mm</span>
                  </div>
                  <button
                    onClick={handleApplyChamfer}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Boolean Operations Buttons */}
              {activeTool.startsWith('boolean') && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-400 flex items-center gap-1.5 mr-1">
                    <Scissors className="w-4 h-4" />
                    <span>Boolean:</span>
                  </span>
                  <button
                    onClick={() => handleApplyBoolean('union')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
                    title="Union (Combine 2 solids)"
                  >
                    ∪ Union
                  </button>
                  <button
                    onClick={() => handleApplyBoolean('difference')}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium"
                    title="Difference (Subtract second solid from first)"
                  >
                    ∖ Difference
                  </button>
                  <button
                    onClick={() => handleApplyBoolean('intersection')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                    title="Intersection (Common volume)"
                  >
                    ∩ Intersection
                  </button>
                  <button
                    onClick={() => setActiveTool('select')}
                    className="p-1 hover:text-white text-gray-400 rounded ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Notification Toast */}
          {statusMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900/90 text-blue-300 border border-blue-500/40 px-4 py-1.5 rounded-full text-xs shadow-xl backdrop-blur flex items-center gap-2 animate-in fade-in zoom-in-95 duration-100">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 4-Viewport Grid */}
          <ViewportGrid />

          {/* On-Click Floating Parametric Inspector */}
          <ParametricInspectorModal />
        </div>
      </div>

      {/* Plugin Manager Modal */}
      <PluginManagerModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
      />

      {/* Bottom Status Bar */}
      <footer className="h-7 bg-[#1c1e24] border-t border-gray-700/80 flex items-center justify-between px-4 text-xs text-gray-400 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span>
            Tool: <strong className="text-white capitalize">{activeTool}</strong>
          </span>
          <span className="text-gray-600">|</span>
          <span>
            Mode: <strong className="text-blue-400 capitalize">{selectionMode}</strong>
          </span>
          <span className="text-gray-600">|</span>
          <span>
            Selected: <strong className="text-amber-400">{selectedEntityIds.length}</strong> objects
          </span>
          {selectedSubElement && (
            <span className="text-cyan-400">
              ({selectedSubElement.subType.toUpperCase()} #{selectedSubElement.index})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 font-mono text-gray-300">
          <span>
            X: <strong className="text-blue-400">{cursorCoords.x.toFixed(2)}</strong>
          </span>
          <span>
            Y: <strong className="text-green-400">{cursorCoords.y.toFixed(2)}</strong>
          </span>
          <span>
            Z: <strong className="text-purple-400">{cursorCoords.z.toFixed(2)}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
