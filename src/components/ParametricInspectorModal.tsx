import React from 'react';
import { useCADStore } from '../store/cadStore';
import { X, Sliders, Layers, Trash2 } from 'lucide-react';

export const ParametricInspectorModal: React.FC = () => {
  const selectedEntityIds = useCADStore((state) => state.selectedEntityIds);
  const selectedSubElement = useCADStore((state) => state.selectedSubElement);
  const entities = useCADStore((state) => state.entities);
  const updateEntityParameters = useCADStore((state) => state.updateEntityParameters);
  const deleteEntity = useCADStore((state) => state.deleteEntity);
  const selectEntity = useCADStore((state) => state.selectEntity);

  if (selectedEntityIds.length === 0) return null;

  const activeEntityId = selectedEntityIds[selectedEntityIds.length - 1];
  const activeEntity = entities.find((e) => e.id === activeEntityId);

  if (!activeEntity) return null;

  const { parameters } = activeEntity;

  const handleParamChange = (key: string, value: number | string) => {
    updateEntityParameters(activeEntityId, { [key]: value });
  };

  return (
    <div className="absolute top-14 right-4 z-50 w-80 bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-lg shadow-2xl p-4 text-gray-200 select-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Inspector Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-700/80">
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

      {/* Selected Element Info */}
      <div className="bg-gray-800/80 rounded p-2.5 mb-3 border border-gray-700/50 text-xs flex justify-between items-center">
        <div>
          <div className="font-semibold text-blue-300">{activeEntity.name}</div>
          <div className="text-gray-400 text-[11px] capitalize">Type: {activeEntity.subType}</div>
        </div>
        {selectedSubElement && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
            Selected {selectedSubElement.subType.toUpperCase()} #{selectedSubElement.index}
          </span>
        )}
      </div>

      {/* Dynamic Parameters Inputs */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
        {/* Dimensions / Radii depending on CAD shape */}
        {parameters.width !== undefined && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-gray-400">Width (X):</label>
            <input
              type="number"
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
              value={parameters.radius}
              onChange={(e) => handleParamChange('radius', parseFloat(e.target.value) || 0)}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-right font-mono text-blue-300 focus:outline-none focus:border-blue-500"
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
                value={parameters.posX || 0}
                onChange={(e) => handleParamChange('posX', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-center font-mono text-blue-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Y</span>
              <input
                type="number"
                value={parameters.posY || 0}
                onChange={(e) => handleParamChange('posY', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-center font-mono text-blue-300 focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Z</span>
              <input
                type="number"
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
