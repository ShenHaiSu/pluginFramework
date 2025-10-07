import { pluginClasses } from "@/plugin";
import { installedPlugins } from "@/util/installedPlugins";
import { getPluginData, getPluginStatus, savePluginStatus } from "@/util/db";
import { info, error } from "@/util/logger";
import { eventEmitter } from "@/util/EventEmitter";

// 框架初始化函数
async function initializeFramework() {
  info("开始初始化插件框架...");

  // 1. 首先初始化事件发射器（事件总线的核心组件）
  eventEmitter.init();
  info("事件发射器初始化完成");

  // 2. 实例化插件前，先从数据库加载插件状态
  const pluginStatusMap = new Map<string, boolean>();

  // 预先实例化所有插件以获取插件信息
  const tempPlugins: any[] = [];
  pluginClasses.forEach((PluginClass) => {
    const tempPlugin = new PluginClass();
    tempPlugins.push(tempPlugin);
  });

  // 从数据库加载插件状态
  for (const plugin of tempPlugins) {
    const savedStatus = await getPluginStatus(plugin.name);
    if (savedStatus !== null) {
      pluginStatusMap.set(plugin.name, savedStatus);
      plugin.enable = savedStatus;
    } else {
      // 如果数据库中没有状态记录，保存当前默认状态
      await savePluginStatus(plugin.name, plugin.enable);
      pluginStatusMap.set(plugin.name, plugin.enable);
    }
  }

  // 清空临时插件列表，重新实例化符合条件的插件
  installedPlugins.length = 0;

  // 3. 根据状态重新实例化插件（跳过被禁用且可禁用的插件）
  pluginClasses.forEach((PluginClass) => {
    const tempPlugin = new PluginClass();
    const savedStatus = pluginStatusMap.get(tempPlugin.name);

    // 如果插件被禁用且可以禁用，则跳过实例化
    if (savedStatus === false && tempPlugin.canDisable) {
      info(`跳过已禁用的插件: ${tempPlugin.name}`);
      return;
    }

    // 应用保存的状态
    tempPlugin.enable = savedStatus ?? tempPlugin.enable;
  });

  info(`发现 ${installedPlugins.length} 个插件`);

  // 4. 从IndexedDB加载数据到插件的databaseData
  for (const plugin of installedPlugins) {
    const savedData = await getPluginData(plugin.name);
    if (!savedData) continue;
    plugin.databaseData = savedData;
    info(`已加载 ${plugin.name} 插件的保存数据`);
  }

  // 5. 调用每个插件的初始化函数
  for (const plugin of installedPlugins) {
    if (plugin.enable) {
      try {
        await plugin.init();
        info(`${plugin.name} 插件初始化成功`);
      } catch (err) {
        error(`${plugin.name} 插件初始化失败:`, err);
        plugin.enable = false; // 初始化失败则禁用插件
      }
    } else {
      info(`${plugin.name} 插件已禁用，跳过初始化`);
    }
  }

  info("插件框架初始化完成");

  // 提供全局访问点
  (window as any).pluginFramework = {
    installedPlugins,
    eventEmitter,
    getPlugin: (name: string) => installedPlugins.find((p) => p.name === name),

    // 插件状态管理API
    /**
     * 启用插件
     * @param pluginName 插件名称
     * @returns 操作是否成功
     */
    enablePlugin: async (pluginName: string): Promise<boolean> => {
      const plugin = installedPlugins.find((p) => p.name === pluginName);
      if (!plugin) {
        error(`插件 ${pluginName} 未找到`);
        return false;
      }

      if (!plugin.canDisable) {
        error(`插件 ${pluginName} 不支持禁用/启用操作`);
        return false;
      }

      try {
        plugin.enable = true;
        await savePluginStatus(pluginName, true);

        // 如果插件未初始化，则进行初始化
        if (plugin.init) {
          await plugin.init();
        }

        info(`插件 ${pluginName} 已启用`);
        return true;
      } catch (err) {
        error(`启用插件 ${pluginName} 失败:`, err);
        return false;
      }
    },

    /**
     * 禁用插件
     * @param pluginName 插件名称
     * @returns 操作是否成功
     */
    disablePlugin: async (pluginName: string): Promise<boolean> => {
      const plugin = installedPlugins.find((p) => p.name === pluginName);
      if (!plugin) {
        error(`插件 ${pluginName} 未找到`);
        return false;
      }

      if (!plugin.canDisable) {
        error(`插件 ${pluginName} 不支持禁用/启用操作`);
        return false;
      }

      try {
        plugin.enable = false;
        await savePluginStatus(pluginName, false);
        info(`插件 ${pluginName} 已禁用`);
        return true;
      } catch (err) {
        error(`禁用插件 ${pluginName} 失败:`, err);
        return false;
      }
    },

    /**
     * 获取插件状态
     * @param pluginName 插件名称
     * @returns 插件状态信息
     */
    getPluginStatus: (pluginName: string) => {
      const plugin = installedPlugins.find((p) => p.name === pluginName);
      if (!plugin) {
        return null;
      }

      return {
        name: plugin.name,
        enable: plugin.enable,
        canDisable: plugin.canDisable,
        describe: plugin.describe,
        tags: plugin.tags,
      };
    },

    /**
     * 获取所有插件状态
     * @returns 所有插件的状态信息数组
     */
    getAllPluginsStatus: () => {
      return installedPlugins.map((plugin) => ({
        name: plugin.name,
        enable: plugin.enable,
        canDisable: plugin.canDisable,
        describe: plugin.describe,
        tags: plugin.tags,
      }));
    },
  };
}

// 启动框架
initializeFramework();
