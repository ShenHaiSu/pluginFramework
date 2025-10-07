import { PluginBase } from "@/util/PluginBase";
import { info, debug } from "@/util/logger";
import { on, off, EventType } from "@/util/EventBus";
import { isMouseButtonEventData } from "@/util/EventTypes";
import { MouseButtonEventData } from "@/util/EventTypes";
import { EVENT_PRIORITY } from "@/util/EventTypes";

export class MousePlugin extends PluginBase {
  private mousedownListenerId: string | null = null;

  constructor() {
    super({
      name: "mouse",
      describe: "监听鼠标左键按下事件",
      enable: true,
      canDisable: true,
      tags: ["mouse", "input", "pointer"],
    });
  }

  /**
   * 初始化插件
   */
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
      leftClickCount: 0,
      lastLeftClick: null,
    };

    // 设置事件总线监听器
    this.setupEventListeners();
  }

  /**
   * 设置事件总线监听器
   */
  private setupEventListeners(): void {
    // 监听鼠标按下事件
    this.mousedownListenerId = on(EventType.MOUSEDOWN, (eventData) => this.handleMouseDown(eventData), {
      priority: EVENT_PRIORITY.NORMAL,
      source: this.name,
    });
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(eventData: any): void {
    if (!isMouseButtonEventData(eventData)) return;

    const mouseButtonData = eventData as MouseButtonEventData;

    // 只处理鼠标左键按下事件
    if (mouseButtonData.data.button === 0) {
      this.internalData.leftClickCount++;
      this.internalData.lastLeftClick = {
        position: { x: mouseButtonData.data.position.x, y: mouseButtonData.data.position.y },
        timestamp: mouseButtonData.timestamp,
      };

      // 记录左键点击历史
      this.databaseData.leftClickHistory = this.databaseData.leftClickHistory || [];
      this.databaseData.leftClickHistory.push(this.internalData.lastLeftClick);

      // 限制历史记录长度
      if (this.databaseData.leftClickHistory.length > 100) {
        this.databaseData.leftClickHistory = this.databaseData.leftClickHistory.slice(-100);
      }

      // 保存数据
      this.saveData();

      info(`鼠标左键按下 - 位置: (${mouseButtonData.data.position.x}, ${mouseButtonData.data.position.y})`);
      debug(`鼠标左键按下: 位置(${mouseButtonData.data.position.x}, ${mouseButtonData.data.position.y})`);
    }
  }

  /**
   * 获取左键点击统计
   */
  getLeftClickStats() {
    return {
      totalLeftClicks: this.internalData.leftClickCount,
      lastLeftClick: this.internalData.lastLeftClick,
      leftClickHistory: this.databaseData.leftClickHistory?.slice(-10) || [],
    };
  }

  /**
   * 清理监听器（插件销毁时调用）
   */
  destroy(): void {
    // 移除鼠标按下事件监听器
    if (this.mousedownListenerId) {
      off(EventType.MOUSEDOWN, this.mousedownListenerId);
      this.mousedownListenerId = null;
    }

    debug(`清理 ${this.name} 插件的事件监听器`);
  }
}
