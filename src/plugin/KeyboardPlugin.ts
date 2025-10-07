import { PluginBase } from "@/util/PluginBase";
import { info, debug } from "@/util/logger";
import { on, off, EventType } from "@/util/EventBus";
import { isKeyboardEventData, isKeybindingEventData, KeyboardEventData, KeybindingEventData, EVENT_PRIORITY } from "@/util/EventTypes";

export class KeyboardPlugin extends PluginBase {
  private keydownListenerId: string | null = null;
  private keyupListenerId: string | null = null;
  private keybindingListenerId: string | null = null;
  // 添加两个测试监听器的ID
  private testListener1Id: string | null = null;
  private testListener2Id: string | null = null;

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

    // 初始化测试相关的数据结构
    this.databaseData.interruptedEvents = this.databaseData.interruptedEvents || [];
    this.databaseData.nonInterruptedEvents = this.databaseData.nonInterruptedEvents || [];

    info(`${this.name} 插件初始化完成，已设置事件中断测试监听器`);
    info(`测试说明: 按下键盘'a'键将触发事件中断机制测试`);
  }

  /**
   * 设置事件总线监听器
   */
  private setupEventListeners(): void {
    info(`${this.name} 插件开始设置事件监听器`);

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

    // 测试监听器1 - 高优先级，监听按键'a'并中断事件传播
    this.testListener1Id = on(EventType.KEYDOWN, (eventData) => this.handleTestListener1(eventData), {
      priority: EVENT_PRIORITY.HIGH + 10, // 设置更高优先级确保先执行
      source: `${this.name}_test1`,
    });
    info(`已注册测试监听器1 (高优先级，用于中断按键'a'事件)`);

    // 测试监听器2 - 低优先级，验证事件是否被中断
    this.testListener2Id = on(EventType.KEYDOWN, (eventData) => this.handleTestListener2(eventData), {
      priority: EVENT_PRIORITY.LOW, // 设置低优先级确保后执行
      source: `${this.name}_test2`,
    });
    info(`已注册测试监听器2 (低优先级，用于验证事件是否被中断)`);

    info(`${this.name} 插件事件监听器设置完成`);
  }

  /**
   * 测试监听器1 - 处理按键'a'并中断事件传播
   * @param eventData 事件数据
   * @returns 如果是按键'a'则返回true中断事件，否则返回false
   */
  private handleTestListener1(eventData: any): boolean {
    if (!isKeyboardEventData(eventData)) return false;

    const keyboardData = eventData as KeyboardEventData;

    // 检查是否是按键'a'或'A'
    if (keyboardData.data.key.toLowerCase() === "a") {
      info(`[测试监听器1] 检测到按键'a'，中断事件传播`);

      // 记录中断事件到数据库
      if (!this.databaseData.interruptedEvents) {
        this.databaseData.interruptedEvents = [];
      }

      this.databaseData.interruptedEvents.push({
        key: keyboardData.data.key,
        timestamp: keyboardData.timestamp,
        listener: "testListener1",
        action: "interrupted",
      });

      // 限制历史记录长度
      if (this.databaseData.interruptedEvents.length > 50) {
        this.databaseData.interruptedEvents = this.databaseData.interruptedEvents.slice(-50);
      }

      this.saveData();

      // 返回true中断事件传播
      return true;
    }

    return false;
  }

  /**
   * 测试监听器2 - 验证事件是否被中断
   * @param eventData 事件数据
   * @returns 始终返回false，不中断事件
   */
  private handleTestListener2(eventData: any): boolean {
    if (!isKeyboardEventData(eventData)) return false;

    const keyboardData = eventData as KeyboardEventData;

    // 检查是否是按键'a'或'A'
    if (keyboardData.data.key.toLowerCase() === "a") {
      // 如果这个监听器被执行了，说明事件没有被中断
      info(`[测试监听器2] 按键'a'事件未被中断，监听器2正常执行`);

      // 记录未中断事件到数据库
      if (!this.databaseData.nonInterruptedEvents) {
        this.databaseData.nonInterruptedEvents = [];
      }

      this.databaseData.nonInterruptedEvents.push({
        key: keyboardData.data.key,
        timestamp: keyboardData.timestamp,
        listener: "testListener2",
        action: "not_interrupted",
      });

      // 限制历史记录长度
      if (this.databaseData.nonInterruptedEvents.length > 50) {
        this.databaseData.nonInterruptedEvents = this.databaseData.nonInterruptedEvents.slice(-50);
      }

      this.saveData();
    } else {
      // 对于非'a'按键，记录正常处理
      debug(`[测试监听器2] 处理按键: ${keyboardData.data.key}`);
    }

    return false;
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
    const stats = {
      keyPressCount: this.internalData.keyPressCount,
      lastKeyPress: this.internalData.lastKeyPress,
      activeModifiers: Array.from(this.internalData.activeModifiers),
      keybindings: this.databaseData.keybindings,
      actionHistory: this.databaseData.actionHistory?.slice(-10) || [],
      keyPressHistory: this.databaseData.keyPressHistory?.slice(-10) || [],
      // 添加中断测试统计信息
      interruptTestStats: this.getInterruptTestStats(),
    };

    // 输出统计信息到日志
    info(`键盘插件统计信息:`);
    info(`- 总按键次数: ${stats.keyPressCount}`);
    info(`- 中断事件总数: ${stats.interruptTestStats.totalInterrupted}`);
    info(`- 未中断事件总数: ${stats.interruptTestStats.totalNonInterrupted}`);

    return stats;
  }

  /**
   * 获取事件中断测试统计信息
   */
  getInterruptTestStats() {
    return {
      interruptedEvents: this.databaseData.interruptedEvents?.slice(-10) || [],
      nonInterruptedEvents: this.databaseData.nonInterruptedEvents?.slice(-10) || [],
      totalInterrupted: this.databaseData.interruptedEvents?.length || 0,
      totalNonInterrupted: this.databaseData.nonInterruptedEvents?.length || 0,
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

    // 清理测试监听器
    if (this.testListener1Id) {
      off(EventType.KEYDOWN, this.testListener1Id);
      this.testListener1Id = null;
    }
    if (this.testListener2Id) {
      off(EventType.KEYDOWN, this.testListener2Id);
      this.testListener2Id = null;
    }

    debug(`清理 ${this.name} 插件的事件监听器`);
  }
}
