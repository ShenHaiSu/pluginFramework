import { emit, EventType } from "@/util/EventBus";
import { createKeyboardEventData, createMouseEventData, COMMON_KEYBINDINGS } from "@/util/EventTypes";
import { debug } from "@/util/logger";

/**
 * 事件发射器 - 负责监听真实的DOM事件并通过事件总线分发
 * 这是事件总线模式的核心组件，作为统一的事件发射方
 */
export class EventEmitter {
  private isInitialized = false;
  private keyboardListeners: Array<() => void> = [];
  private mouseListeners: Array<() => void> = [];

  /**
   * 初始化事件发射器，设置DOM事件监听
   */
  init(): void {
    if (this.isInitialized) {
      debug("事件发射器已经初始化，跳过重复初始化");
      return;
    }

    debug("初始化事件发射器...");

    this.setupKeyboardListeners();
    this.setupMouseListeners();

    this.isInitialized = true;
    debug("事件发射器初始化完成");
  }

  /**
   * 设置键盘事件监听器
   */
  private setupKeyboardListeners(): void {
    // 键盘按下事件
    const keydownHandler = (event: KeyboardEvent) => {
      emit(createKeyboardEventData(EventType.KEYDOWN, event, "EventEmitter"));

      // 检查是否匹配快捷键
      const keybinding = this.checkKeybinding(event);
      if (keybinding) {
        // 发射快捷键事件 - 使用自定义事件类型
        emit({
          type: EventType.KEYBINDING,
          timestamp: new Date().toISOString(),
          source: "EventEmitter",
          data: {
            combination: keybinding.combination,
            action: keybinding.action,
            originalKeyEvent: event,
          },
        });
      }
    };

    // 键盘释放事件
    const keyupHandler = (event: KeyboardEvent) => {
      emit(createKeyboardEventData(EventType.KEYUP, event, "EventEmitter"));
    };

    // 添加事件监听器
    document.addEventListener("keydown", keydownHandler, true);
    document.addEventListener("keyup", keyupHandler, true);

    // 保存清理函数
    this.keyboardListeners.push(
      () => document.removeEventListener("keydown", keydownHandler, true),
      () => document.removeEventListener("keyup", keyupHandler, true)
    );

    debug("键盘事件监听器设置完成");
  }

  /**
   * 设置鼠标事件监听器
   */
  private setupMouseListeners(): void {
    // 鼠标移动事件
    const mousemoveHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEMOVE, event, "EventEmitter"));
    };

    // 鼠标按下事件
    const mousedownHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEDOWN, event, "EventEmitter"));
    };

    // 鼠标释放事件
    const mouseupHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEUP, event, "EventEmitter"));
    };

    // 鼠标点击事件
    const clickHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.CLICK, event, "EventEmitter"));
    };

    // 鼠标双击事件
    const dblclickHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.DBLCLICK, event, "EventEmitter"));
    };

    // 添加事件监听器
    document.addEventListener("mousemove", mousemoveHandler, true);
    document.addEventListener("mousedown", mousedownHandler, true);
    document.addEventListener("mouseup", mouseupHandler, true);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("dblclick", dblclickHandler, true);

    // 保存清理函数
    this.mouseListeners.push(
      () => document.removeEventListener("mousemove", mousemoveHandler, true),
      () => document.removeEventListener("mousedown", mousedownHandler, true),
      () => document.removeEventListener("mouseup", mouseupHandler, true),
      () => document.removeEventListener("click", clickHandler, true),
      () => document.removeEventListener("dblclick", dblclickHandler, true)
    );

    debug("鼠标事件监听器设置完成");
  }

  /**
   * 检查键盘事件是否匹配快捷键
   */
  private checkKeybinding(event: KeyboardEvent): { combination: string; action: string } | null {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");

    const key = event.key.toUpperCase();
    const combination = [...modifiers, key].join("+");

    // 检查常见快捷键
    const action = (COMMON_KEYBINDINGS as any)[combination];
    if (action) {
      return { combination, action };
    }

    return null;
  }

  /**
   * 销毁事件发射器，清理所有事件监听器
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    debug("销毁事件发射器...");

    // 清理键盘事件监听器
    this.keyboardListeners.forEach((cleanup) => cleanup());
    this.keyboardListeners = [];

    // 清理鼠标事件监听器
    this.mouseListeners.forEach((cleanup) => cleanup());
    this.mouseListeners = [];

    this.isInitialized = false;
    debug("事件发射器已销毁");
  }

  /**
   * 获取初始化状态
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 创建全局事件发射器实例
export const eventEmitter = new EventEmitter();
