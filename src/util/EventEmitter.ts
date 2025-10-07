import { debug } from "@/util/logger";
import { KeyboardListener } from "@/util/EventKeyboardListener";
import { MouseListener } from "@/util/EventMouseListener";
import { DomObserver, DomSelectorConfig } from "@/util/EventDomObserver";

/**
 * 事件发射器 - 负责监听真实的DOM事件并通过事件总线分发
 * 这是事件总线模式的核心组件，作为统一的事件发射方
 * 使用组合模式整合各个专门的监听器
 */
export class EventEmitter {
  private isInitialized = false;

  // 各个专门的监听器
  private keyboardListener: KeyboardListener;
  private mouseListener: MouseListener;
  private domObserver: DomObserver;

  /**
   * 构造函数 - 初始化各个监听器
   */
  constructor() {
    this.keyboardListener = new KeyboardListener();
    this.mouseListener = new MouseListener();
    this.domObserver = new DomObserver();
  }

  /**
   * 初始化事件发射器，设置DOM事件监听
   */
  init(): void {
    if (this.isInitialized) {
      debug("事件发射器已经初始化，跳过重复初始化");
      return;
    }

    debug("初始化事件发射器...");

    // 启动各个监听器
    this.keyboardListener.start();
    this.mouseListener.start();
    this.domObserver.start();

    this.isInitialized = true;
    debug("事件发射器初始化完成");
  }

  /**
   * 注册DOM选择器 - 供插件调用
   * @param config 选择器配置
   */
  registerDomSelector(config: DomSelectorConfig): void {
    this.domObserver.registerDomSelector(config);
  }

  /**
   * 取消注册DOM选择器
   * @param pluginName 插件名称
   * @param selector 选择器（可选，不提供则清除该插件的所有选择器）
   */
  unregisterDomSelector(pluginName: string, selector?: string): void {
    this.domObserver.unregisterDomSelector(pluginName, selector);
  }

  /**
   * 监听选择器变更
   * @param callback 回调函数
   * @returns 取消监听的函数
   */
  onSelectorChange(callback: () => void): () => void {
    return this.domObserver.onSelectorChange(callback);
  }

  /**
   * 获取当前注册的选择器统计信息
   */
  getSelectorStats(): { pluginCount: number; selectorCount: number; selectors: DomSelectorConfig[] } {
    return this.domObserver.getSelectorStats();
  }

  /**
   * 获取初始化状态
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 销毁事件发射器，清理所有事件监听器
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    debug("销毁事件发射器...");

    // 停止各个监听器
    this.keyboardListener.stop();
    this.mouseListener.stop();
    this.domObserver.stop();

    // 清理DOM观察器的选择器和回调
    this.domObserver.clear();

    this.isInitialized = false;
    debug("事件发射器已销毁");
  }
}

// 创建全局事件发射器实例
export const eventEmitter = new EventEmitter();
