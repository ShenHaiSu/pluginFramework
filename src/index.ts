import { pluginClasses } from "@/plugin";
import { installedPlugins } from "@/util/installedPlugins";
import { getPluginData } from "@/util/db";
import { info, error } from "@/util/logger";
import { eventEmitter } from "@/util/EventEmitter";

// 框架初始化函数
async function initializeFramework() {
  info("开始初始化插件框架...");

  // 1. 首先初始化事件发射器（事件总线的核心组件）
  eventEmitter.init();
  info("事件发射器初始化完成");

  // 2. 实例化所有插件（会自动加入installedPlugins）
  pluginClasses.forEach((PluginClass) => {
    new PluginClass();
  });

  info(`发现 ${installedPlugins.length} 个插件`);

  // 3. 从IndexedDB加载数据到插件的databaseData
  for (const plugin of installedPlugins) {
    const savedData = await getPluginData(plugin.name);
    if (savedData) {
      plugin.databaseData = savedData;
      info(`已加载 ${plugin.name} 插件的保存数据`);
    }
  }

  // 4. 调用每个插件的初始化函数
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
  };
}

// 启动框架
initializeFramework();
