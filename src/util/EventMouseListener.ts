import { emit, EventType } from "@/util/EventBus";
import { createMouseEventData } from "@/util/EventTypes";
import { debug } from "@/util/logger";

/**
 * 鼠标事件监听器 - 负责监听鼠标事件
 */
export class MouseListener {
  private listeners: Array<() => void> = [];
  private isActive = false;

  /**
   * 启动鼠标事件监听
   */
  start(): void {
    if (this.isActive) {
      debug("鼠标监听器已经启动，跳过重复启动");
      return;
    }

    this.setupMouseListeners();
    this.isActive = true;
    debug("鼠标监听器启动完成");
  }

  /**
   * 停止鼠标事件监听
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    this.listeners.forEach((cleanup) => cleanup());
    this.listeners = [];
    this.isActive = false;
    debug("鼠标监听器已停止");
  }

  /**
   * 获取监听器状态
   */
  isListening(): boolean {
    return this.isActive;
  }

  /**
   * 设置鼠标事件监听器
   */
  private setupMouseListeners(): void {
    // 鼠标移动事件处理器
    const mousemoveHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEMOVE, event, "MouseListener"));
    };

    // 鼠标按下事件处理器
    const mousedownHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEDOWN, event, "MouseListener"));
    };

    // 鼠标释放事件处理器
    const mouseupHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.MOUSEUP, event, "MouseListener"));
    };

    // 鼠标点击事件处理器
    const clickHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.CLICK, event, "MouseListener"));
    };

    // 鼠标双击事件处理器
    const dblclickHandler = (event: MouseEvent) => {
      emit(createMouseEventData(EventType.DBLCLICK, event, "MouseListener"));
    };

    // 添加事件监听器
    document.addEventListener("mousemove", mousemoveHandler, true);
    document.addEventListener("mousedown", mousedownHandler, true);
    document.addEventListener("mouseup", mouseupHandler, true);
    document.addEventListener("click", clickHandler, true);
    document.addEventListener("dblclick", dblclickHandler, true);

    // 保存清理函数
    this.listeners.push(
      () => document.removeEventListener("mousemove", mousemoveHandler, true),
      () => document.removeEventListener("mousedown", mousedownHandler, true),
      () => document.removeEventListener("mouseup", mouseupHandler, true),
      () => document.removeEventListener("click", clickHandler, true),
      () => document.removeEventListener("dblclick", dblclickHandler, true)
    );

    debug("鼠标事件监听器设置完成");
  }
}