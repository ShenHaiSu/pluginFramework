import { PluginBase } from "../util/PluginBase";
import { info } from "../util/logger";

export class MousePlugin extends PluginBase {
  constructor() {
    super("mouse", "监听鼠标事件并跟踪鼠标移动", true, true, ["mouse", "input", "pointer"]);
  }

  async init(): Promise<void> {
    info(`初始化 ${this.name} 插件`);

    // 从数据库加载保存的数据
    const db = await import("../util/db");
    const savedData = await db.getPluginData(this.name);
    if (savedData) {
      this.databaseData = savedData;
    }

    // 初始化内部数据
    this.internalData = {
      clickCount: 0,
      dblClickCount: 0,
      lastClick: null,
      lastPosition: { x: 0, y: 0 },
      isDragging: false,
    };

    // 设置鼠标事件监听
    this.setupMouseListeners();
  }

  private setupMouseListeners(): void {
    // 监听鼠标移动
    document.addEventListener("mousemove", (event) => {
      this.internalData.lastPosition = {
        x: event.clientX,
        y: event.clientY,
      };
    });

    // 监听鼠标点击
    document.addEventListener("click", (event) => {
      this.internalData.clickCount++;
      this.internalData.lastClick = {
        type: "click",
        position: { x: event.clientX, y: event.clientY },
        target: event.target instanceof Element ? event.target.tagName : "unknown",
        timestamp: new Date().toISOString(),
      };

      // 记录点击历史
      this.databaseData.clickHistory = this.databaseData.clickHistory || [];
      this.databaseData.clickHistory.push(this.internalData.lastClick);

      // 限制历史记录长度
      if (this.databaseData.clickHistory.length > 100) {
        this.databaseData.clickHistory = this.databaseData.clickHistory.slice(-100);
      }

      // 保存数据
      this.saveData();
    });

    // 监听双击
    document.addEventListener("dblclick", (event) => {
      this.internalData.dblClickCount++;
      this.internalData.lastClick = {
        type: "dblclick",
        position: { x: event.clientX, y: event.clientY },
        target: event.target instanceof Element ? event.target.tagName : "unknown",
        timestamp: new Date().toISOString(),
      };
    });

    // 监听鼠标按下
    document.addEventListener("mousedown", (event) => {
      this.internalData.isDragging = true;

      // 当鼠标左键按下时发出info日志
      if (event.button === 0) {
        info(`鼠标左键按下 - 位置: (${event.clientX}, ${event.clientY})`);
      }
    });

    // 监听鼠标释放
    document.addEventListener("mouseup", () => {
      this.internalData.isDragging = false;
    });
  }

  // 获取鼠标当前位置
  getCurrentPosition() {
    return this.internalData.lastPosition;
  }

  // 获取点击统计
  getClickStats() {
    return {
      totalClicks: this.internalData.clickCount,
      totalDblClicks: this.internalData.dblClickCount,
      lastClick: this.internalData.lastClick,
    };
  }
}
