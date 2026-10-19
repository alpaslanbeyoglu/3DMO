import React, { useState } from 'react';
import { useCADStore } from '../store/cadStore';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus } from 'lucide-react';

export const LayerManagerPanel: React.FC = () => {
  const layers = useCADStore((state) => state.layers);
  const toggleLayerVisibility = useCADStore((state) => state.toggleLayerVisibility);
  const [newLayerName, setNewLayerName] = useState('');

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-md p-3 text-xs text-gray-300">
      <div className="flex items-center justify-between font-semibold text-gray-200 mb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Layers</span>
        </div>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto mb-2">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center justify-between bg-gray-900/60 px-2 py-1 rounded border border-gray-700/40"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: layer.color }}
              />
              <span className="truncate max-w-[100px]">{layer.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleLayerVisibility(layer.id)}
                className="p-1 hover:text-white rounded"
              >
                {layer.visible ? (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
