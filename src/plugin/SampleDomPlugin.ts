import type { InternalData, DatabaseData } from "@/composable/SampleDomPlugin/types";

import { PluginBase } from "@/util/PluginBase";
import { info } from "@/util/logger";
import { on, off, EventType } from "@/util/EventBus";
import { DomMutationEventData, DomMutationType } from "@/util/EventTypes";
import { eventEmitter } from "@/util/EventEmitter";

export class SampleDomPlugin extends PluginBase<InternalData, DatabaseData> {
  private eventListenerId: string | null = null;

  constructor() {
    super({
      name: "dom",
      describe: "监听DOM变化并提供DOM操作工具",
      enable: true,
      canDisable: true,
      tags: ["dom", "mutation", "ui"],
    });
  }

  async init(): Promise<void> {
    info(`初始化 ${this.name} 插件`);

    // 从数据库加载保存的数据
    const db = await import("@/util/db");
    const savedData = await db.getPluginData(this.name);
    if (savedData) this.databaseData = savedData as DatabaseData;

    // 初始化内部数据
    this.internalData = {
      mutationCount: 0,
      lastMutation: null,
      trackedElements: new Map<string, HTMLElement>(),
    };

    // 设置DOM事件监听器和选择器
    this.setupDomEventListeners();
  }

  /**
   * 设置DOM事件监听器和选择器
   * 封装了事件总线监听器和DOM选择器注册逻辑
   */
  private setupDomEventListeners(): void {
    // 添加监听执行
    this.eventListenerId = on(
      EventType.DOM_MUTATION,
      (eventData) => {
        this.handleDomMutationEvent(eventData as DomMutationEventData);
      },
      { source: this.name, priority: 100 }
    );
    info(`${this.name} 插件已注册事件总线监听器`);

    // 注册DOM选择器以监听具有 class="gallery" 的div元素
    eventEmitter.registerDomSelector({
      selector: "div.gallery",
      pluginName: this.name,
      mutationTypes: [DomMutationType.CHILD_LIST, DomMutationType.ATTRIBUTES, DomMutationType.CHARACTER_DATA], // 指定要监听的变动类型
    });
    info(`${this.name} 插件已注册DOM选择器: div.gallery`);
  }

  /**
   * 处理DOM变化事件
   */
  private handleDomMutationEvent(eventData: DomMutationEventData): void {
    // 更新内部数据统计
    this.internalData.mutationCount += eventData.data.mutationCount;
    this.internalData.lastMutation = {
      count: eventData.data.mutationCount,
      timestamp: eventData.timestamp,
      mutations: eventData.data.mutations.map((m) => ({
        type: m.type,
        target: m.target.nodeName,
        addedNodes: m.addedNodes,
        removedNodes: m.removedNodes,
      })),
    };

    // 记录重要的DOM变化到持久化数据
    if (!this.databaseData.mutationHistory) {
      this.databaseData.mutationHistory = [];
    }

    if (this.internalData.lastMutation) {
      this.databaseData.mutationHistory.push(this.internalData.lastMutation);
    }

    // 限制历史记录长度
    if (this.databaseData.mutationHistory.length > 100) {
      this.databaseData.mutationHistory = this.databaseData.mutationHistory.slice(-100);
    }

    // 保存数据
    this.saveData();

    info(`${this.name} 插件接收到DOM变化事件:`);

    // // 输出每个变化的详细信息
    // for (let index = 0; index < eventData.data.mutations.length; index++) {
    //   const mutation = eventData.data.mutations[index];
    //   info(`DOM变化 ${index + 1}:`, {
    //     type: mutation.type,
    //     target: mutation.target,
    //     addedNodes: mutation.addedNodes,
    //     removedNodes: mutation.removedNodes,
    //     attributeName: mutation.attributeName,
    //   });
    // }
  }

  /**
   * 销毁插件，清理资源
   */
  destroy(): void {
    // 移除事件总线监听器
    if (this.eventListenerId) {
      off(EventType.DOM_MUTATION, this.eventListenerId);
      this.eventListenerId = null;
      info(`${this.name} 插件已移除事件总线监听器`);
    }

    // 取消注册DOM选择器
    eventEmitter.unregisterDomSelector(this.name, "div.gallery");
    info(`${this.name} 插件已取消注册DOM选择器: div.gallery`);

    // 清理内部数据
    if (this.internalData?.trackedElements) {
      this.internalData.trackedElements.clear();
    }

    info(`${this.name} 插件已销毁`);
  }
}
