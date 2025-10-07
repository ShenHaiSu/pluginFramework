import { emit, EventType } from "@/util/EventBus";
import { DomMutationEventData, DomMutationType } from "@/util/EventTypes";
import { debug } from "@/util/logger";

/**
 * DOM选择器注册配置接口
 */
export interface DomSelectorConfig {
  selector: string;
  pluginName: string;
  mutationTypes?: DomMutationType[]; // 可选：指定关注的变动类型
}

/**
 * DOM观察器 - 负责监听DOM变化和管理选择器
 */
export class DomObserver {
  private observer: MutationObserver | null = null;
  private isActive = false;

  // DOM选择器注册表
  private domSelectors: Map<string, DomSelectorConfig[]> = new Map();
  private selectorChangeCallbacks: Array<() => void> = [];

  /**
   * 启动DOM观察器
   */
  start(): void {
    if (this.isActive) {
      debug("DOM观察器已经启动，跳过重复启动");
      return;
    }

    this.setupDomObserver();
    this.isActive = true;
    debug("DOM观察器启动完成");
  }

  /**
   * 停止DOM观察器
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.isActive = false;
    debug("DOM观察器已停止");
  }

  /**
   * 获取观察器状态
   */
  isObserving(): boolean {
    return this.isActive;
  }

  /**
   * 注册DOM选择器 - 供插件调用
   * @param config 选择器配置
   */
  registerDomSelector(config: DomSelectorConfig): void {
    if (!this.domSelectors.has(config.pluginName)) {
      this.domSelectors.set(config.pluginName, []);
    }

    const pluginSelectors = this.domSelectors.get(config.pluginName)!;

    // 检查是否已存在相同选择器
    const existingIndex = pluginSelectors.findIndex((s) => s.selector === config.selector);
    if (existingIndex >= 0) {
      pluginSelectors[existingIndex] = config; // 更新配置
    } else {
      pluginSelectors.push(config); // 添加新配置
    }

    debug(`插件 ${config.pluginName} 注册DOM选择器: ${config.selector}`);

    // 通知选择器变更
    this.notifySelectorChange();
  }

  /**
   * 取消注册DOM选择器
   * @param pluginName 插件名称
   * @param selector 选择器（可选，不提供则清除该插件的所有选择器）
   */
  unregisterDomSelector(pluginName: string, selector?: string): void {
    if (!this.domSelectors.has(pluginName)) return;

    if (selector) {
      // 移除特定选择器
      const pluginSelectors = this.domSelectors.get(pluginName)!;
      const index = pluginSelectors.findIndex((s) => s.selector === selector);
      if (index >= 0) {
        pluginSelectors.splice(index, 1);
        debug(`插件 ${pluginName} 取消注册DOM选择器: ${selector}`);
      }

      // 如果该插件没有选择器了，移除整个条目
      if (pluginSelectors.length === 0) {
        this.domSelectors.delete(pluginName);
      }
    } else {
      // 移除该插件的所有选择器
      this.domSelectors.delete(pluginName);
      debug(`插件 ${pluginName} 取消注册所有DOM选择器`);
    }

    this.notifySelectorChange();
  }

  /**
   * 监听选择器变更
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onSelectorChange(callback: () => void): () => void {
    this.selectorChangeCallbacks.push(callback);

    // 返回取消监听的函数
    return () => {
      const index = this.selectorChangeCallbacks.indexOf(callback);
      if (index >= 0) {
        this.selectorChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 获取当前注册的选择器统计信息
   */
  getSelectorStats(): { pluginCount: number; selectorCount: number; selectors: DomSelectorConfig[] } {
    const allSelectors = this.getAllRegisteredSelectors();
    return {
      pluginCount: this.domSelectors.size,
      selectorCount: allSelectors.length,
      selectors: allSelectors,
    };
  }

  /**
   * 清理所有选择器和回调
   */
  clear(): void {
    this.domSelectors.clear();
    this.selectorChangeCallbacks = [];
    debug("DOM观察器选择器和回调已清理");
  }

  /**
   * 获取所有注册的选择器
   */
  private getAllRegisteredSelectors(): DomSelectorConfig[] {
    const allSelectors: DomSelectorConfig[] = [];
    for (const pluginSelectors of this.domSelectors.values()) {
      allSelectors.push(...pluginSelectors);
    }
    return allSelectors;
  }

  /**
   * 检查DOM元素是否匹配任何注册的选择器
   * 会检查元素本身以及其父元素链
   */
  private isElementMatched(element: Element, mutationType: DomMutationType): DomSelectorConfig[] {
    const allSelectors = this.getAllRegisteredSelectors();

    return allSelectors.filter((config) => {
      // 检查变动类型是否匹配
      if (config.mutationTypes && !config.mutationTypes.includes(mutationType)) {
        return false;
      }

      // 检查选择器是否匹配（包括父元素链）
      try {
        // 使用 closest API 检查元素本身及其父元素链
        // closest 会从元素本身开始向上查找，直到找到匹配的元素或到达文档根部
        return element.closest(config.selector) !== null;
      } catch (error) {
        debug(`选择器 ${config.selector} 语法错误:`, error);
        return false;
      }
    });
  }

  /**
   * 处理所有变动（向后兼容模式）
   */
  private processAllMutations(mutations: MutationRecord[]): void {
    const eventData: DomMutationEventData = {
      type: EventType.DOM_MUTATION,
      timestamp: new Date().toISOString(),
      source: "DomObserver",
      data: {
        mutations: mutations.map((mutation) => ({
          type: this.getMutationType(mutation.type),
          target: {
            nodeName: mutation.target.nodeName,
            nodeType: mutation.target.nodeType,
            id: (mutation.target as Element).id || undefined,
            className: (mutation.target as Element).className || undefined,
          },
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          attributeName: mutation.attributeName || undefined,
          oldValue: mutation.oldValue || undefined,
        })),
        mutationCount: mutations.length,
      },
    };

    emit(eventData);
    debug(`DomObserver检测到 ${mutations.length} 个DOM变化并发送到事件总线（全量模式）`);
  }

  /**
   * 处理过滤后的变动
   */
  private processMutations(mutations: MutationRecord[]): void {
    const eventData: DomMutationEventData = {
      type: EventType.DOM_MUTATION,
      timestamp: new Date().toISOString(),
      source: "DomObserver",
      data: {
        mutations: mutations.map((mutation) => ({
          type: this.getMutationType(mutation.type),
          target: {
            nodeName: mutation.target.nodeName,
            nodeType: mutation.target.nodeType,
            id: (mutation.target as Element).id || undefined,
            className: (mutation.target as Element).className || undefined,
          },
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          attributeName: mutation.attributeName || undefined,
          oldValue: mutation.oldValue || undefined,
        })),
        mutationCount: mutations.length,
      },
    };

    emit(eventData);
    debug(`DomObserver检测到 ${mutations.length} 个相关DOM变化并发送到事件总线（过滤模式）`);
  }

  /**
   * 通知选择器变更
   */
  private notifySelectorChange(): void {
    this.selectorChangeCallbacks.forEach((callback) => callback());
  }

  /**
   * 设置DOM变化观察器（优化版本）
   */
  private setupDomObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      const allSelectors = this.getAllRegisteredSelectors();

      // 如果没有注册任何选择器，处理所有变动（向后兼容）
      if (allSelectors.length === 0) {
        this.processAllMutations(mutations);
        return;
      }

      // 过滤出匹配选择器的变动
      const relevantMutations = mutations.filter((mutation) => {
        const target = mutation.target as Element;
        const mutationType = this.getMutationType(mutation.type);

        // 检查目标元素是否匹配
        const matchedConfigs = this.isElementMatched(target, mutationType);
        if (matchedConfigs.length > 0) {
          return true;
        }

        // 对于子节点变动，还需要检查新增的节点
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const addedElement = node as Element;
              const matchedConfigs = this.isElementMatched(addedElement, mutationType);
              if (matchedConfigs.length > 0) {
                return true;
              }
            }
          }
        }

        return false;
      });

      // 如果没有相关变动，直接返回
      if (relevantMutations.length === 0) {
        return;
      }

      // 处理相关变动
      this.processMutations(relevantMutations);
    });

    // 观察整个文档的变化
    this.observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    debug("DOM变化观察器设置完成（优化版本）");
  }

  /**
   * 转换MutationRecord类型到自定义枚举
   */
  private getMutationType(type: string): DomMutationType {
    switch (type) {
      case "childList":
        return DomMutationType.CHILD_LIST;
      case "attributes":
        return DomMutationType.ATTRIBUTES;
      case "characterData":
        return DomMutationType.CHARACTER_DATA;
      default:
        return DomMutationType.CHILD_LIST;
    }
  }
}
