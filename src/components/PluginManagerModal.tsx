import React from 'react';
import { useCADStore } from '../store/cadStore';
import { pluginManager } from '../plugins/pluginManager';
import { Puzzle, Check, Plus, X, Trash2 } from 'lucide-react';

export const PluginManagerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const activePlugins = useCADStore((state) => state.activePlugins);

  if (!isOpen) return null;

  const handleRegisterGearPlugin = () => {
    pluginManager.registerPlugin({
      manifest: {
        id: 'gear-addon',
        name: 'Parametric Spur Gear Generator',
        version: '1.2.0',
        description: 'Generates precision spur gears with custom pitch diameter, teeth, and hub bore',
        author: 'Mechanical CAD Lab',
      },
      activate: (ctx) => {
        ctx.addTool({
          id: 'gear_tool',
          label: 'Generate Spur Gear',
          action: () => {
            ctx.addEntity({
              name: 'Spur Gear 16T',
              type: 'solid',
              subType: 'cylinder',
              visible: true,
              color: '#f59e0b',
              layerId: 'default',
              parameters: {
                radius: 10,
                height: 4,
                teeth: 16,
                bevelSize: 0.5,
                bevelSegments: 2,
                posX: 0,
                posY: 2,
                posZ: 0,
              },
            });
          },
        });
      },
    });
  };

  const handleRegisterFastenersPlugin = () => {
    pluginManager.registerPlugin({
      manifest: {
        id: 'fastener-addon',
        name: 'ISO Hex Bolt & Nut Fasteners',
        version: '1.0.4',
        description: 'Generates standard ISO/DIN hexagonal socket bolts, hex nuts, and flat washers',
        author: 'FastenerTools',
      },
      activate: (ctx) => {
        ctx.addTool({
          id: 'bolt_tool',
          label: 'Generate M8 Hex Bolt',
          action: () => {
            // Hex head + shaft
            ctx.addEntity({
              name: 'M8 Hex Bolt Head',
              type: 'solid',
              subType: 'cylinder',
              visible: true,
              color: '#94a3b8',
              layerId: 'default',
              parameters: {
                radius: 6.5,
                height: 5,
                bevelSize: 0.8,
                posX: 0,
                posY: 10,
                posZ: 0,
              },
            });
            ctx.addEntity({
              name: 'M8 Bolt Shaft',
              type: 'solid',
              subType: 'cylinder',
              visible: true,
              color: '#cbd5e1',
              layerId: 'default',
              parameters: {
                radius: 4,
                height: 20,
                posX: 0,
                posY: 0,
                posZ: 0,
              },
            });
          },
        });
      },
    });
  };

  const handleRegisterSpringPlugin = () => {
    pluginManager.registerPlugin({
      manifest: {
        id: 'spring-addon',
        name: 'Spring & Helix Coil Generator',
        version: '2.0.1',
        description: 'Generates parametric compression springs, coils, and helical wire paths',
        author: 'SpringCAD Works',
      },
      activate: (ctx) => {
        ctx.addTool({
          id: 'spring_tool',
          label: 'Generate Coil Spring',
          action: () => {
            ctx.addEntity({
              name: 'Compression Spring',
              type: 'solid',
              subType: 'torus',
              visible: true,
              color: '#38bdf8',
              layerId: 'default',
              parameters: {
                radius: 8,
                tube: 1.5,
                posX: 0,
                posY: 4,
                posZ: 0,
              },
            });
          },
        });
      },
    });
  };

  const isGearActive = activePlugins.some((p) => p.id === 'gear-addon');
  const isFastenerActive = activePlugins.some((p) => p.id === 'fastener-addon');
  const isSpringActive = activePlugins.some((p) => p.id === 'spring-addon');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
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
          Extend 3DMO capabilities with community plugins, custom procedural generators, and CAD macros (similar to Blender Add-ons).
        </p>

        {/* Available / Active Plugins list */}
        <div className="space-y-2.5 mb-5 max-h-72 overflow-y-auto pr-1">
          {/* Gear Plugin */}
          <div className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-gray-700/60">
            <div>
              <div className="flex items-center gap-2 font-semibold text-xs text-purple-300">
                <span>Parametric Spur Gear Generator</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                  v1.2.0
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Generates precision gears with custom pitch diameter, teeth, and hub bore
              </div>
            </div>
            {isGearActive ? (
              <button
                onClick={() => pluginManager.deactivatePlugin('gear-addon')}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                onClick={handleRegisterGearPlugin}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}
          </div>

          {/* Fastener Plugin */}
          <div className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-gray-700/60">
            <div>
              <div className="flex items-center gap-2 font-semibold text-xs text-purple-300">
                <span>ISO Hex Bolt & Fasteners</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                  v1.0.4
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Generates standard ISO/DIN hexagonal socket bolts, hex nuts, and washers
              </div>
            </div>
            {isFastenerActive ? (
              <button
                onClick={() => pluginManager.deactivatePlugin('fastener-addon')}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                onClick={handleRegisterFastenersPlugin}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}
          </div>

          {/* Spring Plugin */}
          <div className="flex items-center justify-between p-3 bg-gray-800/80 rounded-lg border border-gray-700/60">
            <div>
              <div className="flex items-center gap-2 font-semibold text-xs text-purple-300">
                <span>Spring & Helix Coil Generator</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                  v2.0.1
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Generates parametric compression springs, coils, and helical wire paths
              </div>
            </div>
            {isSpringActive ? (
              <button
                onClick={() => pluginManager.deactivatePlugin('spring-addon')}
                className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            ) : (
              <button
                onClick={handleRegisterSpringPlugin}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Install</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
