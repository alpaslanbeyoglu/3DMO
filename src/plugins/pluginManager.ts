import { Plugin, PluginContext, CADEntity } from '../types/cad';
import { useCADStore } from '../store/cadStore';

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginTools: Map<string, string[]> = new Map();

  public registerPlugin(plugin: Plugin) {
    if (this.plugins.has(plugin.manifest.id)) {
      console.warn(`Plugin ${plugin.manifest.id} is already registered.`);
      return;
    }

    const toolIds: string[] = [];
    this.pluginTools.set(plugin.manifest.id, toolIds);

    const context: PluginContext = {
      addTool: (tool) => {
        toolIds.push(tool.id);
        useCADStore.getState().addCustomTool(tool);
      },
      addInspectorPanel: (panel) => {
        useCADStore.getState().addCustomInspectorPanel(panel);
      },
      registerCommand: (commandId, handler) => {
        useCADStore.getState().registerCommand(commandId, handler);
      },
      getEntities: () => {
        return useCADStore.getState().entities;
      },
      addEntity: (entity) => {
        return useCADStore.getState().addEntity(entity);
      },
    };

    try {
      plugin.activate(context);
      this.plugins.set(plugin.manifest.id, plugin);
      useCADStore.getState().addActivePlugin(plugin.manifest);
      console.log(`Plugin activated: ${plugin.manifest.name} v${plugin.manifest.version}`);
    } catch (err) {
      console.error(`Failed to activate plugin ${plugin.manifest.name}:`, err);
    }
  }

  public deactivatePlugin(id: string) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      if (plugin.deactivate) {
        plugin.deactivate();
      }
      const tools = this.pluginTools.get(id) || [];
      tools.forEach((tId) => useCADStore.getState().removeCustomTool(tId));
      this.pluginTools.delete(id);
      this.plugins.delete(id);
      useCADStore.getState().removeActivePlugin(id);
    }
  }

  public getPlugins() {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }
}

export const pluginManager = new PluginManager();
