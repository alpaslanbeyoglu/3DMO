import React, { useState } from 'react';
import { useCADStore } from '../store/cadStore';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, Check } from 'lucide-react';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const LayerManagerPanel: React.FC = () => {
  const layers = useCADStore((state) => state.layers);
  const activeLayerId = useCADStore((state) => state.activeLayerId);
  const setActiveLayerId = useCADStore((state) => state.setActiveLayerId);
  const toggleLayerVisibility = useCADStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useCADStore((state) => state.toggleLayerLock);
  const addLayer = useCADStore((state) => state.addLayer);
  const removeLayer = useCADStore((state) => state.removeLayer);

  const [newLayerName, setNewLayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#60a5fa');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim()) return;
    addLayer(newLayerName.trim(), selectedColor);
    setNewLayerName('');
    setIsAdding(false);
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700/60 rounded-lg p-3 text-xs text-gray-300 select-none">
      <div className="flex items-center justify-between font-semibold text-gray-200 mb-2.5 pb-1.5 border-b border-gray-700/50">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Layers</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 hover:text-white rounded bg-gray-700/60 hover:bg-gray-700 text-gray-300 transition-colors"
          title="Add New Layer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New Layer Form */}
      {isAdding && (
        <form onSubmit={handleCreateLayer} className="mb-2.5 p-2 bg-gray-900/80 rounded border border-gray-700 space-y-2">
          <input
            type="text"
            placeholder="Layer name..."
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="submit"
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Layer List */}
      <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`flex items-center justify-between px-2 py-1.5 rounded border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500/50 text-white'
                  : 'bg-gray-900/50 border-gray-700/40 hover:bg-gray-800/60 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="truncate max-w-[95px] text-[11px]">{layer.name}</span>
                {isActive && <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1 rounded font-mono">Active</span>}
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleLayerLock(layer.id)}
                  className="p-1 hover:text-white rounded"
                  title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                >
                  {layer.locked ? (
                    <Lock className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Unlock className="w-3 h-3 text-gray-500 hover:text-gray-300" />
                  )}
                </button>
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="p-1 hover:text-white rounded"
                  title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3 text-blue-400" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-500" />
                  )}
                </button>
                {layer.id !== 'default' && (
                  <button
                    onClick={() => removeLayer(layer.id)}
                    className="p-1 hover:text-red-400 rounded text-gray-500"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
