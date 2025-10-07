import { installedPlugins } from "@/util/installedPlugins";

export abstract class PluginBase {
  // 插件基本信息
  name: string;
  describe: string;
  enable: boolean;
  canDisable: boolean;
  tags: string[];

  // 数据存储
  internalData: Record<string, any>;
  databaseData: Record<string, any>;

  constructor(name: string, describe: string, enable: boolean = true, canDisable: boolean = true, tags: string[] = []) {
    this.name = name;
    this.describe = describe;
    this.enable = enable;
    this.canDisable = canDisable;
    this.tags = tags;
    this.internalData = {};
    this.databaseData = {};

    // 将实例推入实装插件列表
    installedPlugins.push(this);
  }

  // 初始化函数，子类必须实现
  abstract init(): Promise<void>;

  // 保存数据到IndexedDB
  async saveData(): Promise<void> {
    const db = await import("@/util/db");
    await db.savePluginData(this.name, this.databaseData);
  }

  // 获取其他插件
  getPlugin<T extends PluginBase>(name: string): T | undefined {
    return installedPlugins.find((plugin) => plugin.name === name) as T;
  }
}
