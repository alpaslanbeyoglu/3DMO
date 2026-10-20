import React from 'react';
import { useCADStore } from '../store/cadStore';
import { performExtrude, performBevel, performFillet, performChamfer } from '../cad/operations';
import { X, Sliders, Trash2, Copy, Sparkles, Layers, Box, Maximize2 } from 'lucide-react';

export const ParametricInspectorModal: React.FC = () => {
  const selectedEntityIds = useCADStore((state) => state.selectedEntityIds);
  const selectedSubElement = useCADStore((state) => state.selectedSubElement);
  const selectionMode = useCADStore((state) => state.selectionMode);
  const entities = useCADStore((state) => state.entities);
  const layers = useCADStore((state) => state.layers);
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const deleteEntity = useCADStore((state) => state.deleteEntity);
  const duplicateEntity = useCADStore((state) => state.duplicateEntity);
  const selectEntity = useCADStore((state) => state.selectEntity);
  const addEntity = useCADStore((state) => state.addEntity);

  if (selectedEntityIds.length === 0) return null;

  const activeEntityId = selectedEntityIds[selectedEntityIds.length - 1];
  const activeEntity = entities.find((e) => e.id === activeEntityId);

  if (!activeEntity) return null;

  const { parameters } = activeEntity;

  const handleParamChange = (key: string, value: any) => {
    updateEntityParameters(activeEntityId, { [key]: value });
  };

  // Sub-element direct action: Extrude Face
  const handleExtrudeSelectedFace = () => {
    if (!activeEntity) return;
    const extruded = performExtrude(activeEntity, { distance: 10, bevelEnabled: true, bevelSize: 0.5 });
    addEntity(extruded);
  };

  // Sub-element direct action: Bevel Edge
  const handleBevelSelectedEdge = () => {
    if (!activeEntity) return;
    const beveled = performBevel(activeEntity, 1.5, 3);
    updateEntityParameters(activeEntityId, beveled.parameters);
  };

  return (
    <div className="absolute top-14 right-4 z-50 w-84 bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-xl shadow-2xl p-4 text-gray-200 select-none animate-in fade-in slide-in-from-right-4 duration-150">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-700/80">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Parametric Inspector
          </h2>
        </div>
        <button
          onClick={() => selectEntity(null)}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Element & Sub-element Badge */}
      <div className="bg-gray-800/80 rounded-lg p-3 mb-3 border border-gray-700/50 text-xs">
        <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-blue-300 text-sm truncate max-w-[180px]">{activeEntity.name}</div>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono uppercase">
            {activeEntity.type}: {activeEntity.subType}
          </span>
        </div>

        {/* Sub-element context if in Vertex, Edge, or Face mode */}
        {selectedSubElement && selectedSubElement.entityId === activeEntityId ? (
          <div className="mt-2 pt-2 border-t border-gray-700/60 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Selected {selectedSubElement.subType.toUpperCase()} #{selectedSubElement.index}
              </span>
              <span className="text-[10px] text-gray-400 capitalize">Mode: {selectionMode}</span>
            </div>

            {selectedSubElement.subType === 'vertex' && selectedSubElement.data?.point && (
              <div className="text-[10px] text-gray-300 font-mono bg-gray-900/60 p-1.5 rounded">
                X: {selectedSubElement.data.point.x.toFixed(2)} | Y: {selectedSubElement.data.point.y.toFixed(2)} | Z: {selectedSubElement.data.point.z.toFixed(2)}
              </div>
            )}

            {selectedSubElement.subType === 'face' && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleExtrudeSelectedFace}
                  className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium flex items-center justify-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Extrude This Face</span>
                </button>
              </div>
            )}

            {selectedSubElement.subType === 'edge' && (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleBevelSelectedEdge}
                  className="flex-1 py-1 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Bevel This Edge</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-gray-400 mt-1">
            Mode: <strong className="text-gray-200 capitalize">{selectionMode}</strong>
          </div>
        )}
      </div>

      {/* Dynamic Parameters Inputs */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs">
        {/* Layer Assignment & Color */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-gray-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            <span>Layer:</span>
          </label>
          <select
            value={activeEntity.layerId}
            onChange={(e) => updateEntityParameters(activeEntityId, { layerId: e.target.value })}
            className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-blue-300 focus:outline-none"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Picker */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-gray-400">Color:</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeEntity.color || '#3b82f6'}
              onChange={(e) => updateEntityParameters(activeEntityId, { color: e.target.value })}
              className="w-7 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
            />
            <span className="font-mono text-[11px] text-gray-400">{activeEntity.color || '#3b82f6'}</span>
          </div>
        </div>

        {/* Dimensions depending on CAD shape */}
        {parameters.width !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Width (X):</label>
            <input
              type="number"
              step="1"
              value={parameters.width}
              onChange={(e) => handleParamChange('width', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {parameters.height !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Height (Y):</label>
            <input
              type="number"
              step="1"
              value={parameters.height}
              onChange={(e) => handleParamChange('height', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {parameters.depth !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Depth (Z):</label>
            <input
              type="number"
              step="1"
              value={parameters.depth}
              onChange={(e) => handleParamChange('depth', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {parameters.radius !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Radius:</label>
            <input
              type="number"
              step="0.5"
              value={parameters.radius}
              onChange={(e) => handleParamChange('radius', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {parameters.tube !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Tube Thickness:</label>
            <input
              type="number"
              step="0.5"
              value={parameters.tube}
              onChange={(e) => handleParamChange('tube', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* BEVEL & FILLET SECTION */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-[11px] font-semibold text-purple-400 mb-1.5 flex items-center justify-between">
            <span>Bevel & Fillet Settings</span>
            {parameters.bevelSize > 0 && (
              <span className="text-[10px] text-green-400 font-mono">Active ({parameters.bevelSize}mm)</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-gray-400 text-[11px]">Bevel Size (mm):</label>
            <input
              type="number"
              step="0.2"
              min="0"
              max="10"
              value={parameters.bevelSize ?? 0}
              onChange={(e) => handleParamChange('bevelSize', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label className="text-gray-400 text-[11px]">Bevel Segments:</label>
            <input
              type="number"
              step="1"
              min="1"
              max="8"
              value={parameters.bevelSegments ?? 2}
              onChange={(e) => handleParamChange('bevelSegments', parseInt(e.target.value) || 1)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400 text-[11px]">Fillet Radius:</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={parameters.filletRadius ?? 0}
              onChange={(e) => handleParamChange('filletRadius', Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Extrusion / Revolve / Boolean info */}
        {parameters.extrudeDistance !== undefined && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
            <label className="text-gray-400">Extrude Height:</label>
            <input
              type="number"
              step="1"
              value={parameters.extrudeDistance}
              onChange={(e) => handleParamChange('extrudeDistance', parseFloat(e.target.value) || 1)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        {parameters.revolveAngle !== undefined && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-800">
            <label className="text-gray-400">Revolve Angle (°):</label>
            <input
              type="number"
              step="15"
              value={parameters.revolveAngle}
              onChange={(e) => handleParamChange('revolveAngle', parseFloat(e.target.value) || 360)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        {/* Position coordinates */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-[11px] font-semibold text-gray-400 mb-1">Position Coordinates</div>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <span className="text-[10px] text-gray-500 block">X</span>
              <input
                type="number"
                step="0.5"
                value={parameters.posX || 0}
                onChange={(e) => handleParamChange('posX', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-center font-mono text-blue-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Y</span>
              <input
                type="number"
                step="0.5"
                value={parameters.posY || 0}
                onChange={(e) => handleParamChange('posY', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-center font-mono text-blue-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Z</span>
              <input
                type="number"
                step="0.5"
                value={parameters.posZ || 0}
                onChange={(e) => handleParamChange('posZ', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-center font-mono text-blue-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 mt-3 border-t border-gray-700/80 flex items-center justify-between">
        <button
          onClick={() => duplicateEntity(activeEntityId)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 text-xs transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-blue-400" />
          <span>Duplicate</span>
        </button>

        <button
          onClick={() => deleteEntity(activeEntityId)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded border border-red-500/30 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
