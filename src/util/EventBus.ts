/**
 * 事件总线模块 - 提供统一的事件管理机制
 * 支持事件监听器注册、事件触发和短路机制
 */

import { debug, warn, error } from "@/util/logger";

// 事件类型枚举
export enum EventType {
  // 键盘事件
  KEYDOWN = "keydown",
  KEYUP = "keyup",
  KEYBINDING = "keybinding",

  // 鼠标事件
  MOUSEMOVE = "mousemove",
  MOUSEDOWN = "mousedown",
  MOUSEUP = "mouseup",
  CLICK = "click",
  DBLCLICK = "dblclick",

  // DOM事件
  DOM_MUTATION = "dom_mutation",

  // 网络事件
  NETWORK_REQUEST = "network_request",
  NETWORK_RESPONSE = "network_response",

  // 自定义事件
  CUSTOM = "custom",
}

// 事件数据接口
export interface EventData {
  type: EventType;
  timestamp: string;
  source?: string;
  data?: any;
  originalEvent?: Event;
}

// 事件监听器类型
export type EventListener = (eventData: EventData) => boolean | void | Promise<boolean | void>;

// 监听器配置接口
export interface ListenerConfig {
  id: string;
  listener: EventListener;
  priority: number; // 优先级，数字越大优先级越高
  once?: boolean; // 是否只执行一次
  source?: string; // 监听器来源（插件名称等）
}

/**
 * 事件总线类 - 核心事件管理器
 */
export class EventBus {
  private listeners: Map<EventType, ListenerConfig[]> = new Map();
  private isProcessing: boolean = false;
  private eventQueue: EventData[] = [];
  private executionContext: Map<string, any> = new Map();

  /**
   * 注册事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   * @param options 监听器配置选项
   */
  public on(eventType: EventType, listener: EventListener, options: Partial<ListenerConfig> = {}): string {
    const config: ListenerConfig = {
      id: options.id || this.generateListenerId(),
      listener,
      priority: options.priority || 0,
      once: options.once || false,
      source: options.source || "unknown",
    };

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const eventListeners = this.listeners.get(eventType)!;
    eventListeners.push(config);

    // 按优先级排序（优先级高的在前）
    eventListeners.sort((a, b) => b.priority - a.priority);

    debug(`注册事件监听器: ${eventType} (ID: ${config.id}, 来源: ${config.source})`);
    return config.id;
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listenerId 监听器ID
   * @returns 是否成功移除
   */
  public off(eventType: EventType, listenerId: string): boolean {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return false;

    const index = listeners.findIndex((listener) => listener.id === listenerId);
    if (index === -1) return false;

    listeners.splice(index, 1);

    // 如果没有监听器了，删除该事件类型
    if (listeners.length === 0) {
      this.listeners.delete(eventType);
    }

    return true;
  }

  /**
   * 触发事件
   * @param eventData 事件数据
   * @returns 是否被短路中断
   */
  public async emit(eventData: EventData): Promise<boolean> {
    // 如果正在处理事件，将新事件加入队列
    if (this.isProcessing) {
      this.eventQueue.push(eventData);
      return false;
    }

    this.isProcessing = true;
    let wasShortCircuited = false;

    try {
      wasShortCircuited = await this.processEvent(eventData);

      // 处理队列中的事件
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift()!;
        await this.processEvent(queuedEvent);
      }
    } catch (err) {
      error("事件处理过程中发生错误:", err);
    } finally {
      this.isProcessing = false;
    }

    return wasShortCircuited;
  }

  /**
   * 处理单个事件
   * @param eventData 事件数据
   * @returns 是否被短路中断
   */
  private async processEvent(eventData: EventData): Promise<boolean> {
    const eventListeners = this.listeners.get(eventData.type);
    if (!eventListeners || eventListeners.length === 0) {
      return false;
    }

    debug(`触发事件: ${eventData.type} (监听器数量: ${eventListeners.length})`);

    // 设置执行上下文
    this.setExecutionContext("currentEvent", eventData);
    this.setExecutionContext("startTime", Date.now());

    const listenersToRemove: string[] = [];

    for (const config of eventListeners) {
      try {
        // 设置当前监听器上下文
        this.setExecutionContext("currentListener", config);

        const result = await config.listener(eventData);

        // 如果监听器返回 true，则短路中断后续监听器
        if (result === true) {
          debug(`事件被短路中断: ${eventData.type} (监听器: ${config.id})`);

          // 如果是一次性监听器，标记为待移除
          if (config.once) {
            listenersToRemove.push(config.id);
          }

          return true;
        }

        // 如果是一次性监听器，标记为待移除
        if (config.once) {
          listenersToRemove.push(config.id);
        }
      } catch (err) {
        error(`监听器执行错误 (${config.id}):`, err);

        // 错误的监听器也要检查是否为一次性
        if (config.once) {
          listenersToRemove.push(config.id);
        }
      }
    }

    // 移除一次性监听器
    for (const listenerId of listenersToRemove) {
      this.off(eventData.type, listenerId);
    }

    // 清理执行上下文
    this.clearExecutionContext();

    return false;
  }

  /**
   * 设置执行上下文
   * @param key 上下文键
   * @param value 上下文值
   */
  public setExecutionContext(key: string, value: any): void {
    this.executionContext.set(key, value);
  }

  /**
   * 获取执行上下文
   * @param key 上下文键
   * @returns 上下文值
   */
  public getExecutionContext(key: string): any {
    return this.executionContext.get(key);
  }

  /**
   * 清理执行上下文
   */
  public clearExecutionContext(): void {
    this.executionContext.clear();
  }

  /**
   * 生成监听器ID
   * @returns 唯一的监听器ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 获取指定事件类型的监听器数量
   * @param eventType 事件类型
   * @returns 监听器数量
   */
  public getListenerCount(eventType: EventType): number {
    const eventListeners = this.listeners.get(eventType);
    return eventListeners ? eventListeners.length : 0;
  }

  /**
   * 获取所有事件类型的监听器统计
   * @returns 监听器统计信息
   */
  public getListenerStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [eventType, listeners] of this.listeners) {
      stats[eventType] = listeners.length;
    }
    return stats;
  }

  /**
   * 清理所有监听器
   */
  public clear(): void {
    this.listeners.clear();
    this.eventQueue = [];
    this.clearExecutionContext();
    debug("已清理所有事件监听器");
  }

  /**
   * 移除指定来源的所有监听器
   * @param source 来源标识
   */
  public removeListenersBySource(source: string): void {
    for (const [eventType, listeners] of this.listeners) {
      const filteredListeners = listeners.filter((config) => config.source !== source);
      this.listeners.set(eventType, filteredListeners);
    }
    debug(`已移除来源为 ${source} 的所有监听器`);
  }
}

// 导出全局事件总线实例和便捷函数
export const eventBus = new EventBus();
export const on = eventBus.on.bind(eventBus);
export const off = eventBus.off.bind(eventBus);
export const emit = eventBus.emit.bind(eventBus);
export const setExecutionContext = eventBus.setExecutionContext.bind(eventBus);
export const getExecutionContext = eventBus.getExecutionContext.bind(eventBus);
export const clearExecutionContext = eventBus.clearExecutionContext.bind(eventBus);
