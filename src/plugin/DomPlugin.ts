import { PluginBase } from "@/util/PluginBase";
import { info } from "@/util/logger";

export class DomPlugin extends PluginBase {
  private observer: MutationObserver | null = null;

  constructor() {
    super("dom", "监听DOM变化并提供DOM操作工具", true, false, ["dom", "mutation", "ui"]);
  }

  async init(): Promise<void> {
    info(`初始化 ${this.name} 插件`);

    // 从数据库加载保存的数据
    const db = await import("@/util/db");
    const savedData = await db.getPluginData(this.name);
    if (savedData) {
      this.databaseData = savedData;
    }

    // 初始化内部数据
    this.internalData = {
      mutationCount: 0,
      lastMutation: null,
      trackedElements: new Map<string, HTMLElement>(),
    };

    // 设置DOM观察器
    this.setupDomObserver();
  }

  private setupDomObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      this.internalData.mutationCount += mutations.length;
      this.internalData.lastMutation = {
        count: mutations.length,
        timestamp: new Date().toISOString(),
        mutations: mutations.map((m) => ({
          type: m.type,
          target: m.target.nodeName,
          addedNodes: m.addedNodes.length,
          removedNodes: m.removedNodes.length,
        })),
      };

      // 记录重要的DOM变化到持久化数据
      if (!this.databaseData.mutationHistory) {
        this.databaseData.mutationHistory = [];
      }

      this.databaseData.mutationHistory.push(this.internalData.lastMutation);

      // 限制历史记录长度
      if (this.databaseData.mutationHistory.length > 100) {
        this.databaseData.mutationHistory = this.databaseData.mutationHistory.slice(-100);
      }

      // 保存数据
      this.saveData();
    });

    // 观察整个文档的变化
    this.observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  // 跟踪特定元素
  trackElement(id: string): HTMLElement | null {
    const element = document.getElementById(id);
    if (element) {
      this.internalData.trackedElements.set(id, element);
      return element;
    }
    return null;
  }

  // 停止观察
  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
