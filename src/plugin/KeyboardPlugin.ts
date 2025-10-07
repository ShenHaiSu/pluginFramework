import { PluginBase } from "@/util/PluginBase";
import { info, debug } from "@/util/logger";
import { on, off, EventType } from "@/util/EventBus";
import { isKeyboardEventData, isKeybindingEventData, KeyboardEventData, KeybindingEventData, EVENT_PRIORITY } from "@/util/EventTypes";

export class KeyboardPlugin extends PluginBase {
  private keydownListenerId: string | null = null;
  private keyupListenerId: string | null = null;
  private keybindingListenerId: string | null = null;

  constructor() {
    super({
      name: "keyboard",
      describe: "监听键盘事件并管理快捷键",
      enable: true,
      canDisable: true,
      tags: ["keyboard", "input", "hotkeys"],
    });
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
      keyPressCount: 0,
      lastKeyPress: null,
      activeModifiers: new Set<string>(),
    };

    // 设置事件总线监听器
    this.setupEventListeners();

    // 初始化快捷键配置
    this.databaseData.keybindings = this.databaseData.keybindings || {
      "Ctrl+S": "save",
      "Ctrl+Z": "undo",
      "Ctrl+Y": "redo",
    };
  }

  /**
   * 设置事件总线监听器
   */
  private setupEventListeners(): void {
    // 监听键盘按下事件
    this.keydownListenerId = on(EventType.KEYDOWN, (eventData) => this.handleKeydown(eventData), {
      priority: EVENT_PRIORITY.NORMAL,
      source: this.name,
    });

    // 监听键盘释放事件
    this.keyupListenerId = on(EventType.KEYUP, (eventData) => this.handleKeyup(eventData), {
      priority: EVENT_PRIORITY.NORMAL,
      source: this.name,
    });

    // 监听快捷键事件
    this.keybindingListenerId = on(EventType.KEYBINDING, (eventData) => this.handleKeybinding(eventData), {
      priority: EVENT_PRIORITY.HIGH,
      source: this.name,
    });
  }

  /**
   * 处理键盘按下事件
   */
  private handleKeydown(eventData: any): void {
    if (!isKeyboardEventData(eventData)) return;

    const keyboardData = eventData as KeyboardEventData;
    this.internalData.keyPressCount++;

    // 输出信息当前按下的是哪个按键
    info(`键盘按下: ${keyboardData.data.key}`);

    // 跟踪修饰键
    if (keyboardData.data.ctrlKey) this.internalData.activeModifiers.add("Ctrl");
    if (keyboardData.data.altKey) this.internalData.activeModifiers.add("Alt");
    if (keyboardData.data.shiftKey) this.internalData.activeModifiers.add("Shift");
    if (keyboardData.data.metaKey) this.internalData.activeModifiers.add("Meta");

    // 记录最后一次按键
    this.internalData.lastKeyPress = {
      key: keyboardData.data.key,
      code: keyboardData.data.code,
      modifiers: Array.from(this.internalData.activeModifiers),
      timestamp: keyboardData.timestamp,
    };

    // 将按键信息推入插件的databaseData中
    if (!this.databaseData.keyPressHistory) this.databaseData.keyPressHistory = [];
    this.databaseData.keyPressHistory.push({
      key: keyboardData.data.key,
      code: keyboardData.data.code,
      modifiers: Array.from(this.internalData.activeModifiers),
      timestamp: keyboardData.timestamp,
    });

    // 限制历史记录长度，例如，只保留最新的100条
    if (this.databaseData.keyPressHistory.length > 100) {
      this.databaseData.keyPressHistory = this.databaseData.keyPressHistory.slice(-100);
    }

    // 保存数据
    this.saveData();

    debug(`键盘按下: ${keyboardData.data.key} (修饰键: ${Array.from(this.internalData.activeModifiers).join("+")})`);
  }

  /**
   * 处理键盘释放事件
   */
  private handleKeyup(eventData: any): void {
    if (!isKeyboardEventData(eventData)) return;

    const keyboardData = eventData as KeyboardEventData;

    // 移除释放的修饰键
    if (!keyboardData.data.ctrlKey) this.internalData.activeModifiers.delete("Ctrl");
    if (!keyboardData.data.altKey) this.internalData.activeModifiers.delete("Alt");
    if (!keyboardData.data.shiftKey) this.internalData.activeModifiers.delete("Shift");
    if (!keyboardData.data.metaKey) this.internalData.activeModifiers.delete("Meta");
  }

  /**
   * 检查是否匹配快捷键
   */
  private checkKeybinding(event: KeyboardEvent): string | null {
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");

    const key = event.key.toUpperCase();
    const keybinding = [...modifiers, key].join("+");

    return this.databaseData.keybindings?.[keybinding] || null;
  }

  /**
   * 处理快捷键事件
   */
  private handleKeybinding(eventData: any): void {
    if (!isKeybindingEventData(eventData)) return;

    const keybindingData = eventData as KeybindingEventData;
    debug(`触发快捷键动作: ${keybindingData.data.action}`);

    // 记录快捷键使用情况
    this.databaseData.actionHistory = this.databaseData.actionHistory || [];
    this.databaseData.actionHistory.push({
      action: keybindingData.data.action,
      combination: keybindingData.data.combination,
      timestamp: keybindingData.timestamp,
    });

    // 限制历史记录长度
    if (this.databaseData.actionHistory.length > 100) {
      this.databaseData.actionHistory = this.databaseData.actionHistory.slice(-100);
    }

    // 保存数据
    this.saveData();
  }

  /**
   * 添加自定义快捷键
   */
  addKeybinding(combination: string, action: string): void {
    if (!this.databaseData.keybindings) {
      this.databaseData.keybindings = {};
    }
    this.databaseData.keybindings[combination] = action;
    this.saveData();
  }

  /**
   * 获取键盘统计信息
   */
  getKeyboardStats() {
    return {
      keyPressCount: this.internalData.keyPressCount,
      lastKeyPress: this.internalData.lastKeyPress,
      activeModifiers: Array.from(this.internalData.activeModifiers),
      keybindings: this.databaseData.keybindings,
      actionHistory: this.databaseData.actionHistory?.slice(-10) || [],
      keyPressHistory: this.databaseData.keyPressHistory?.slice(-10) || [],
    };
  }

  /**
   * 清理监听器（插件销毁时调用）
   */
  destroy(): void {
    // 移除所有事件监听器
    if (this.keydownListenerId) {
      off(EventType.KEYDOWN, this.keydownListenerId);
      this.keydownListenerId = null;
    }
    if (this.keyupListenerId) {
      off(EventType.KEYUP, this.keyupListenerId);
      this.keyupListenerId = null;
    }
    if (this.keybindingListenerId) {
      off(EventType.KEYBINDING, this.keybindingListenerId);
      this.keybindingListenerId = null;
    }

    debug(`清理 ${this.name} 插件的事件监听器`);
  }
}
