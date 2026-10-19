import React, { useState } from 'react';
import { ViewportGrid } from './components/ViewportGrid';
import { ParametricInspectorModal } from './components/ParametricInspectorModal';
import { LayerManagerPanel } from './components/LayerManagerPanel';
import { PluginManagerModal } from './components/PluginManagerModal';
import { useCADStore } from './store/cadStore';
import { exportProjectJSON, exportToSTL, exportToSTEP } from './utils/exportImport';
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
} from 'lucide-react';

export const App: React.FC = () => {
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const activeTool = useCADStore((state) => state.activeTool);
  const setActiveTool = useCADStore((state) => state.setActiveTool);
  const snapping = useCADStore((state) => state.snapping);
  const setSnappingSettings = useCADStore((state) => state.setSnappingSettings);
  const addEntity = useCADStore((state) => state.addEntity);
  const entities = useCADStore((state) => state.entities);
  const layers = useCADStore((state) => state.layers);
  const customTools = useCADStore((state) => state.customTools);

  const handleAddBox = () => {
    addEntity({
      name: 'Box',
      type: 'solid',
      subType: 'box',
      visible: true,
      color: '#3b82f6',
      layerId: 'default',
      parameters: { width: 10, height: 10, depth: 10, posX: 0, posY: 0, posZ: 0 },
    });
  };

  const handleAddCylinder = () => {
    addEntity({
      name: 'Cylinder',
      type: 'solid',
      subType: 'cylinder',
      visible: true,
      color: '#10b981',
      layerId: 'default',
      parameters: { radius: 5, height: 12, posX: 0, posY: 0, posZ: 0 },
    });
  };

  const handleAddSphere = () => {
    addEntity({
      name: 'Sphere',
      type: 'solid',
      subType: 'sphere',
      visible: true,
      color: '#f59e0b',
      layerId: 'default',
      parameters: { radius: 6, posX: 0, posY: 0, posZ: 0 },
    });
  };

  const handleAddCone = () => {
    addEntity({
      name: 'Cone',
      type: 'solid',
      subType: 'cone',
      visible: true,
      color: '#ec4899',
      layerId: 'default',
      parameters: { radius: 5, height: 10, posX: 0, posY: 0, posZ: 0 },
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-gray-200 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-11 bg-gray-800 border-b border-gray-700/80 flex items-center justify-between px-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-blue-400 text-lg tracking-wider">
            <Package className="w-6 h-6 text-blue-500" />
            <span>3DMO</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            Parametric CAD v1.0
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Export Menu */}
          <div className="flex items-center gap-1 bg-gray-900/60 p-1 rounded border border-gray-700 text-xs">
            <button
              onClick={() => exportProjectJSON(entities, layers)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-blue-400" />
              <span>.MOI3D</span>
            </button>
            <button
              onClick={() => exportToSTL(entities)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
            >
              <span>STL</span>
            </button>
            <button
              onClick={() => exportToSTEP(entities)}
              className="px-2 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded flex items-center gap-1"
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

          {/* Snapping Quick Controls */}
          <div className="flex items-center gap-3 text-xs pl-3 border-l border-gray-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={snapping.gridSnap}
                onChange={(e) => setSnappingSettings({ gridSnap: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <Grid className="w-3.5 h-3.5 text-blue-400" />
              <span>Grid Snap</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={snapping.objectSnap}
                onChange={(e) => setSnappingSettings({ objectSnap: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <Move className="w-3.5 h-3.5 text-green-400" />
              <span>Object Snap</span>
            </label>
          </div>
        </div>
      </header>

      {/* Main CAD Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar (MOI 3D Draw & Construct Command Panels) */}
        <aside className="w-60 bg-gray-800/90 border-r border-gray-700/80 flex flex-col p-3 gap-4 overflow-y-auto shrink-0 select-none">
          {/* Layer Manager Panel */}
          <LayerManagerPanel />

          {/* Plugins Custom Tools Section */}
          {customTools.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
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

          {/* Draw Curve Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Circle className="w-3.5 h-3.5 text-blue-400" />
              Draw Curve
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTool('line')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'line'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>
              <button
                onClick={() => setActiveTool('polyline')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'polyline'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Minus className="w-3.5 h-3.5 rotate-45" />
                <span>Polyline</span>
              </button>
              <button
                onClick={() => setActiveTool('circle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'circle'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Circle</span>
              </button>
              <button
                onClick={() => setActiveTool('rectangle')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'rectangle'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>
            </div>
          </div>

          {/* Draw Solid Primitives Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              Draw Solid
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleAddBox}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-700/60 border border-gray-600/60 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-blue-400" />
                <span>+ Box</span>
              </button>
              <button
                onClick={handleAddCylinder}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-700/60 border border-gray-600/60 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Cylinder className="w-3.5 h-3.5 text-green-400" />
                <span>+ Cylinder</span>
              </button>
              <button
                onClick={handleAddSphere}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-700/60 border border-gray-600/60 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Circle className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Sphere</span>
              </button>
              <button
                onClick={handleAddCone}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs bg-gray-700/60 border border-gray-600/60 rounded text-gray-300 hover:bg-gray-700 hover:text-white text-left transition-colors"
              >
                <Box className="w-3.5 h-3.5 text-pink-400" />
                <span>+ Cone</span>
              </button>
            </div>
          </div>

          {/* Construct / Modeling Operations Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-green-400" />
              Construct & Edit
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setActiveTool('extrude')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'extrude'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>Extrude</span>
              </button>
              <button
                onClick={() => setActiveTool('revolve')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'revolve'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>Revolve</span>
              </button>
              <button
                onClick={() => setActiveTool('boolean_union')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'boolean_union'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>Boolean</span>
              </button>
              <button
                onClick={() => setActiveTool('fillet')}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border text-left transition-colors ${
                  activeTool === 'fillet'
                    ? 'bg-blue-600 border-blue-500 text-white font-medium'
                    : 'bg-gray-700/60 border-gray-600/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>Fillet</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center 4-Viewport Container */}
        <div className="flex-1 bg-black relative">
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
      <footer className="h-7 bg-gray-800 border-t border-gray-700/80 flex items-center justify-between px-4 text-xs text-gray-400 shrink-0">
        <div className="flex items-center gap-4">
          <span>Active Tool: <strong className="text-white capitalize">{activeTool}</strong></span>
        </div>
        <div className="flex items-center gap-4 font-mono text-gray-400">
          <span>X: 0.00</span>
          <span>Y: 0.00</span>
          <span>Z: 0.00</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
