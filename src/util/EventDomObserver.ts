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

  // 防抖相关
  private debounceTimer: number | null = null;
  private pendingMutations: MutationRecord[] = [];
  private readonly debounceDelay = 16; // ~60fps，约16ms

  // 选择器缓存
  private selectorCache: Map<
    string,
    {
      matcher: (element: Element) => boolean;
      config: DomSelectorConfig;
    }
  > = new Map();

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
   * 智能启动 - 只有在有选择器注册时才启动
   */
  private smartStart(): void {
    const allSelectors = this.getAllRegisteredSelectors();

    if (!this.isActive && allSelectors.length > 0) {
      this.start();
      debug(`DOM观察器智能启动，当前有 ${allSelectors.length} 个选择器`);
    } else if (this.isActive) {
      // 如果已经启动，重新配置观察器以优化性能
      this.reconfigureObserver();
    }
  }

  /**
   * 智能停止 - 当没有选择器时自动停止
   */
  private smartStop(): void {
    const allSelectors = this.getAllRegisteredSelectors();

    if (this.isActive && allSelectors.length === 0) {
      this.stop();
      debug("DOM观察器智能停止，没有注册的选择器");
    } else if (this.isActive) {
      // 如果还有选择器，重新配置观察器
      this.reconfigureObserver();
    }
  }

  /**
   * 重新配置观察器以优化性能
   */
  private reconfigureObserver(): void {
    if (this.observer && this.isActive) {
      // 断开当前观察器
      this.observer.disconnect();

      // 使用新的配置重新启动
      const observeConfig = this.getOptimalObserveConfig();
      this.observer.observe(document, observeConfig);

      debug("DOM观察器重新配置完成", observeConfig);
    }
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

    // 清理防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // 清理待处理的变动
    this.pendingMutations = [];

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

    // 预编译选择器到缓存
    this.compileSelectorCache(config);

    // 智能启动观察器
    this.smartStart();

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

        // 从缓存中移除
        const cacheKey = `${pluginName}:${selector}`;
        this.selectorCache.delete(cacheKey);
      }

      // 如果该插件没有选择器了，移除整个条目
      if (pluginSelectors.length === 0) {
        this.domSelectors.delete(pluginName);
      }
    } else {
      // 移除该插件的所有选择器
      const pluginSelectors = this.domSelectors.get(pluginName) || [];

      // 从缓存中移除该插件的所有选择器
      pluginSelectors.forEach((config) => {
        const cacheKey = `${pluginName}:${config.selector}`;
        this.selectorCache.delete(cacheKey);
      });

      this.domSelectors.delete(pluginName);
      debug(`插件 ${pluginName} 取消注册所有DOM选择器`);
    }

    // 智能停止观察器
    this.smartStop();

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
    this.selectorCache.clear();

    // 清理防抖相关
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingMutations = [];
    debug("DOM观察器选择器和缓存已清理");
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
   * 预编译选择器缓存
   * @param config 选择器配置
   */
  private compileSelectorCache(config: DomSelectorConfig): void {
    const cacheKey = `${config.pluginName}:${config.selector}`;

    try {
      // 创建优化的匹配函数
      const matcher = (element: Element): boolean => {
        try {
          // 首先检查元素本身是否匹配
          if (element.matches && element.matches(config.selector)) {
            return true;
          }

          // 然后检查父元素链
          if (element.closest && element.closest(config.selector) !== null) {
            return true;
          }

          return false;
        } catch (error) {
          // 选择器语法错误时返回false
          return false;
        }
      };

      this.selectorCache.set(cacheKey, { matcher, config });
      debug(`选择器已预编译: ${config.selector}`);
    } catch (error) {
      debug(`选择器编译失败: ${config.selector}`, error);
    }
  }

  /**
   * 使用缓存的选择器进行快速匹配
   * @param element DOM元素
   * @param mutationType 变动类型
   * @returns 匹配的选择器配置数组
   */
  private isElementMatchedWithCache(element: Element, mutationType: DomMutationType): DomSelectorConfig[] {
    const matchedConfigs: DomSelectorConfig[] = [];

    // 使用缓存的匹配器进行快速检查
    for (const { matcher, config } of this.selectorCache.values()) {
      // 检查变动类型是否匹配
      if (config.mutationTypes && !config.mutationTypes.includes(mutationType)) {
        continue;
      }

      // 使用预编译的匹配器
      if (matcher(element)) {
        matchedConfigs.push(config);
      }
    }

    return matchedConfigs;
  }

  /**
   * 检查DOM元素是否匹配任何注册的选择器（向后兼容版本）
   * 会检查元素本身以及其父元素链
   */
  private isElementMatched(element: Element, mutationType: DomMutationType): DomSelectorConfig[] {
    // 优先使用缓存版本
    if (this.selectorCache.size > 0) {
      return this.isElementMatchedWithCache(element, mutationType);
    }

    // 向后兼容：使用原始逻辑
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
      // 防抖处理
      this.pendingMutations.push(...mutations);

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        this.processBatchedMutations();
        this.pendingMutations = [];
        this.debounceTimer = null;
      }, this.debounceDelay);
    });

    // 动态调整观察配置
    const observeConfig = this.getOptimalObserveConfig();
    this.observer.observe(document, observeConfig);

    debug("DOM变化观察器设置完成（优化版本）", observeConfig);
  }

  /**
   * 动态获取最优观察配置
   */
  private getOptimalObserveConfig(): MutationObserverInit {
    const allSelectors = this.getAllRegisteredSelectors();
    const mutationTypes = new Set<DomMutationType>();

    // 根据注册的选择器优化观察配置
    allSelectors.forEach((config) => {
      if (config.mutationTypes && config.mutationTypes.length > 0) {
        config.mutationTypes.forEach((type) => mutationTypes.add(type));
      } else {
        // 默认观察所有类型
        mutationTypes.add(DomMutationType.CHILD_LIST);
        mutationTypes.add(DomMutationType.ATTRIBUTES);
        mutationTypes.add(DomMutationType.CHARACTER_DATA);
      }
    });

    // 如果没有选择器，使用默认配置
    if (mutationTypes.size === 0) {
      mutationTypes.add(DomMutationType.CHILD_LIST);
      mutationTypes.add(DomMutationType.ATTRIBUTES);
      mutationTypes.add(DomMutationType.CHARACTER_DATA);
    }

    const config: MutationObserverInit = {
      childList: mutationTypes.has(DomMutationType.CHILD_LIST),
      subtree: true, // 始终观察子树
      attributes: mutationTypes.has(DomMutationType.ATTRIBUTES),
      characterData: mutationTypes.has(DomMutationType.CHARACTER_DATA),
    };

    // 如果观察属性变化，添加属性过滤
    if (config.attributes) {
      // 可以根据选择器进一步优化属性过滤
      config.attributeOldValue = true;
    }

    // 如果观察字符数据变化
    if (config.characterData) {
      config.characterDataOldValue = true;
    }

    return config;
  }

  /**
   * 批量处理变动
   */
  private processBatchedMutations(): void {
    if (this.pendingMutations.length === 0) return;

    const relevantMutations = this.filterRelevantMutations(this.pendingMutations);

    if (relevantMutations.length > 0) {
      this.processMutations(relevantMutations);
    }
  }

  /**
   * 使用缓存的选择器进行快速过滤
   */
  private filterRelevantMutations(mutations: MutationRecord[]): MutationRecord[] {
    const allSelectors = this.getAllRegisteredSelectors();

    // 如果没有注册任何选择器，处理所有变动（向后兼容）
    if (allSelectors.length === 0) {
      return mutations;
    }

    return mutations.filter((mutation) => {
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
