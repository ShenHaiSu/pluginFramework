import { installedPlugins } from "@/util/installedPlugins";

/**
 * 插件构造器参数接口
 */
export interface PluginConfig {
  name: string;
  describe: string;
  enable?: boolean;
  canDisable?: boolean;
  tags?: string[];
}

export abstract class PluginBase<TInternalData extends Record<string, any> = Record<string, any>, TDatabaseData extends Record<string, any> = Record<string, any>> {
  // 插件基本信息
  name: string;
  describe: string;
  enable: boolean;
  canDisable: boolean;
  tags: string[];

  // 数据存储
  internalData: TInternalData;
  databaseData: TDatabaseData;

  /**
   * 插件基类构造器
   * @param config 插件配置对象
   */
  constructor(config: PluginConfig) {
    this.name = config.name;
    this.describe = config.describe;
    this.enable = config.enable ?? true;
    this.canDisable = config.canDisable ?? true;
    this.tags = config.tags ?? [];
    this.internalData = {} as TInternalData;
    this.databaseData = {} as TDatabaseData;

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
