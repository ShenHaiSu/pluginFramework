import { emit, EventType } from "@/util/EventBus";
import { createKeyboardEventData, COMMON_KEYBINDINGS } from "@/util/EventTypes";
import { debug } from "@/util/logger";

/**
 * 键盘事件监听器 - 负责监听键盘事件并处理快捷键
 */
export class KeyboardListener {
  private listeners: Array<() => void> = [];
  private isActive = false;

  /**
   * 启动键盘事件监听
   */
  start(): void {
    if (this.isActive) {
      debug("键盘监听器已经启动，跳过重复启动");
      return;
    }

    this.setupKeyboardListeners();
    this.isActive = true;
    debug("键盘监听器启动完成");
  }

  /**
   * 停止键盘事件监听
   */
  stop(): void {
    if (!this.isActive) return;

    this.listeners.forEach((cleanup) => cleanup());
    this.listeners = [];
    this.isActive = false;
    debug("键盘监听器已停止");
  }

  /**
   * 获取监听器状态
   */
  isListening(): boolean {
    return this.isActive;
  }

  /**
   * 设置键盘事件监听器
   */
  private setupKeyboardListeners(): void {
    // 键盘按下事件处理器
    const keydownHandler = (event: KeyboardEvent) => {
      emit(createKeyboardEventData(EventType.KEYDOWN, event, "KeyboardListener"));

      // 检查是否匹配快捷键
      const keybinding = this.checkKeybinding(event);
      if (keybinding) {
        // 发射快捷键事件
        emit({
          type: EventType.KEYBINDING,
          timestamp: new Date().toISOString(),
          source: "KeyboardListener",
          data: {
            combination: keybinding.combination,
            action: keybinding.action,
            originalKeyEvent: event,
          },
        });
      }
    };

    // 键盘释放事件处理器
    const keyupHandler = (event: KeyboardEvent) => {
      emit(createKeyboardEventData(EventType.KEYUP, event, "KeyboardListener"));
    };

    // 添加事件监听器
    document.addEventListener("keydown", keydownHandler, true);
    document.addEventListener("keyup", keyupHandler, true);

    // 保存清理函数
    this.listeners.push(
      () => document.removeEventListener("keydown", keydownHandler, true),
      () => document.removeEventListener("keyup", keyupHandler, true)
    );

    debug("键盘事件监听器设置完成");
  }

  /**
   * 检查键盘事件是否匹配快捷键
   * @param event 键盘事件
   * @returns 匹配的快捷键信息或null
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
}
