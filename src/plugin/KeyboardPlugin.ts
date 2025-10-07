import { PluginBase } from "@/util/PluginBase";
import { info, debug } from "@/util/logger";

export class KeyboardPlugin extends PluginBase {
  constructor() {
    super("keyboard", "监听键盘事件并管理快捷键", true, true, ["keyboard", "input", "hotkeys"]);
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

    // 设置键盘事件监听
    this.setupKeyboardListeners();

    // 初始化快捷键配置
    this.databaseData.keybindings = this.databaseData.keybindings || {
      "Ctrl+S": "save",
      "Ctrl+Z": "undo",
      "Ctrl+Y": "redo",
    };
  }

  private setupKeyboardListeners(): void {
    // 监听键盘按下事件
    document.addEventListener("keydown", (event) => {
      this.internalData.keyPressCount++;

      // 跟踪修饰键
      if (event.ctrlKey) this.internalData.activeModifiers.add("Ctrl");
      if (event.altKey) this.internalData.activeModifiers.add("Alt");
      if (event.shiftKey) this.internalData.activeModifiers.add("Shift");
      if (event.metaKey) this.internalData.activeModifiers.add("Meta");

      // 记录最后一次按键
      this.internalData.lastKeyPress = {
        key: event.key,
        code: event.code,
        modifiers: Array.from(this.internalData.activeModifiers),
        timestamp: new Date().toISOString(),
      };

      // 检查是否匹配快捷键
      const keybinding = this.checkKeybinding(event);
      if (keybinding) {
        this.handleKeybinding(keybinding);
      }
    });

    // 监听键盘释放事件
    document.addEventListener("keyup", (event) => {
      // 移除释放的修饰键
      if (!event.ctrlKey) this.internalData.activeModifiers.delete("Ctrl");
      if (!event.altKey) this.internalData.activeModifiers.delete("Alt");
      if (!event.shiftKey) this.internalData.activeModifiers.delete("Shift");
      if (!event.metaKey) this.internalData.activeModifiers.delete("Meta");
    });
  }

  // 检查是否匹配快捷键
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

  // 处理快捷键
  private handleKeybinding(action: string): void {
    debug(`触发快捷键动作: ${action}`);

    // 记录快捷键使用情况
    this.databaseData.actionHistory = this.databaseData.actionHistory || [];
    this.databaseData.actionHistory.push({
      action,
      timestamp: new Date().toISOString(),
    });

    // 限制历史记录长度
    if (this.databaseData.actionHistory.length > 100) {
      this.databaseData.actionHistory = this.databaseData.actionHistory.slice(-100);
    }

    // 保存数据
    this.saveData();
  }

  // 添加自定义快捷键
  addKeybinding(combination: string, action: string): void {
    if (!this.databaseData.keybindings) {
      this.databaseData.keybindings = {};
    }
    this.databaseData.keybindings[combination] = action;
    this.saveData();
  }
}
