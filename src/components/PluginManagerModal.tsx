import React, { useState } from 'react';
import { useCADStore } from '../store/cadStore';
import { pluginManager } from '../plugins/pluginManager';
import { Puzzle, Check, Plus, X } from 'lucide-react';

export const PluginManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const activePlugins = useCADStore((state) => state.activePlugins);

  if (!isOpen) return null;

  const handleRegisterSamplePlugin = () => {
    pluginManager.registerPlugin({
      manifest: {
        id: 'sample-addon-1',
        name: 'Gear & Bolt Generator Addon',
        version: '1.0.0',
        description: 'Generates 3D CAD Parametric Gears and Fasteners',
        author: 'Community Developer',
      },
      activate: (ctx) => {
        ctx.addTool({
          id: 'gear_tool',
          label: 'Generate Gear',
          action: () => {
            ctx.addEntity({
              name: 'Parametric Gear',
              type: 'solid',
              subType: 'cylinder',
              visible: true,
              color: '#f59e0b',
              layerId: 'default',
              parameters: { radius: 8, height: 4, teeth: 16, posX: 0, posY: 0, posZ: 0 },
            });
          },
        });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl w-full max-w-lg p-5 text-gray-200 select-none animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Plugin & Add-on Manager</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          Extend 3DMO capabilities with custom tools, parametric shape generators, and commands (similar to Blender Add-ons).
        </p>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {activePlugins.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500 bg-gray-950/50 rounded border border-gray-800">
              No plugins currently active.
            </div>
          ) : (
            activePlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between p-3 bg-gray-800/80 rounded border border-gray-700/60"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-sm text-purple-300">
                    <span>{plugin.name}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                      v{plugin.version}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{plugin.description}</div>
                </div>
                <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                  <Check className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-gray-800 flex justify-between items-center">
          <button
            onClick={handleRegisterSamplePlugin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Load Sample Gear Add-on</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
