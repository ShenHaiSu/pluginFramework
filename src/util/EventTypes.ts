/**
 * 事件类型定义模块 - 定义具体的事件数据接口和常量
 * 为事件总线提供类型安全的事件数据结构
 */

import { EventType, EventData } from "@/util/EventBus";

// ========== 键盘事件相关类型 ==========

/**
 * 键盘事件数据接口
 */
export interface KeyboardEventData extends EventData {
  type: EventType.KEYDOWN | EventType.KEYUP;
  data: {
    key: string;
    code: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    repeat: boolean;
    location: number;
  };
  originalEvent: KeyboardEvent;
}

/**
 * 快捷键事件数据接口
 */
export interface KeybindingEventData extends EventData {
  type: EventType.KEYBINDING;
  data: {
    combination: string; // 如 "Ctrl+S"
    action: string;
    originalKeyEvent: KeyboardEvent;
  };
}

// ========== 鼠标事件相关类型 ==========

/**
 * 鼠标位置接口
 */
export interface MousePosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
}

/**
 * 鼠标移动事件数据接口
 */
export interface MouseMoveEventData extends EventData {
  type: EventType.MOUSEMOVE;
  data: {
    position: MousePosition;
    movementX: number;
    movementY: number;
    buttons: number;
  };
  originalEvent: MouseEvent;
}

/**
 * 鼠标按键事件数据接口
 */
export interface MouseButtonEventData extends EventData {
  type: EventType.MOUSEDOWN | EventType.MOUSEUP;
  data: {
    position: MousePosition;
    button: number; // 0: 左键, 1: 中键, 2: 右键
    buttons: number;
    detail: number; // 点击次数
  };
  originalEvent: MouseEvent;
}

/**
 * 鼠标点击事件数据接口
 */
export interface MouseClickEventData extends EventData {
  type: EventType.CLICK | EventType.DBLCLICK;
  data: {
    position: MousePosition;
    button: number;
    detail: number;
    target: {
      tagName: string;
      id?: string;
      className?: string;
      textContent?: string;
    };
  };
  originalEvent: MouseEvent;
}

// ========== DOM事件相关类型 ==========

/**
 * DOM变化类型枚举
 */
export enum DomMutationType {
  CHILD_LIST = "childList",
  ATTRIBUTES = "attributes",
  CHARACTER_DATA = "characterData",
}

/**
 * DOM变化事件数据接口
 */
export interface DomMutationEventData extends EventData {
  type: EventType.DOM_MUTATION;
  data: {
    mutations: Array<{
      type: DomMutationType;
      target: {
        nodeName: string;
        nodeType: number;
        id?: string;
        className?: string;
      };
      addedNodes: number;
      removedNodes: number;
      attributeName?: string;
      oldValue?: string;
    }>;
    mutationCount: number;
  };
}

// ========== 网络事件相关类型 ==========

/**
 * 网络请求事件数据接口
 */
export interface NetworkRequestEventData extends EventData {
  type: EventType.NETWORK_REQUEST;
  data: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    requestId: string;
  };
}

/**
 * 网络响应事件数据接口
 */
export interface NetworkResponseEventData extends EventData {
  type: EventType.NETWORK_RESPONSE;
  data: {
    url: string;
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    body?: string;
    requestId: string;
    responseTime: number; // 响应时间（毫秒）
  };
}

// ========== 自定义事件相关类型 ==========

/**
 * 自定义事件数据接口
 */
export interface CustomEventData extends EventData {
  type: EventType.CUSTOM;
  data: {
    eventName: string;
    payload?: any;
    metadata?: Record<string, any>;
  };
}

// ========== 事件常量定义 ==========

/**
 * 键盘按键常量
 */
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  TAB: "Tab",
  BACKSPACE: "Backspace",
  DELETE: "Delete",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
} as const;

/**
 * 鼠标按键常量
 */
export const MOUSE_BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
  BACK: 3,
  FORWARD: 4,
} as const;

/**
 * 修饰键常量
 */
export const MODIFIER_KEYS = {
  CTRL: "Ctrl",
  ALT: "Alt",
  SHIFT: "Shift",
  META: "Meta",
} as const;

/**
 * 常用快捷键组合
 */
export const COMMON_KEYBINDINGS = {
  SAVE: "Ctrl+S",
  COPY: "Ctrl+C",
  PASTE: "Ctrl+V",
  CUT: "Ctrl+X",
  UNDO: "Ctrl+Z",
  REDO: "Ctrl+Y",
  SELECT_ALL: "Ctrl+A",
  FIND: "Ctrl+F",
  REFRESH: "F5",
  DEV_TOOLS: "F12",
} as const;

/**
 * 事件优先级常量
 */
export const EVENT_PRIORITY = {
  HIGHEST: 1000,
  HIGH: 500,
  NORMAL: 0,
  LOW: -500,
  LOWEST: -1000,
} as const;

// ========== 类型守卫函数 ==========

/**
 * 检查是否为键盘事件数据
 */
export function isKeyboardEventData(eventData: EventData): eventData is KeyboardEventData {
  return eventData.type === EventType.KEYDOWN || eventData.type === EventType.KEYUP;
}

/**
 * 检查是否为快捷键事件数据
 */
export function isKeybindingEventData(eventData: EventData): eventData is KeybindingEventData {
  return eventData.type === EventType.KEYBINDING;
}

/**
 * 检查是否为鼠标移动事件数据
 */
export function isMouseMoveEventData(eventData: EventData): eventData is MouseMoveEventData {
  return eventData.type === EventType.MOUSEMOVE;
}

/**
 * 检查是否为鼠标按键事件数据
 */
export function isMouseButtonEventData(eventData: EventData): eventData is MouseButtonEventData {
  return eventData.type === EventType.MOUSEDOWN || eventData.type === EventType.MOUSEUP;
}

/**
 * 检查是否为鼠标点击事件数据
 */
export function isMouseClickEventData(eventData: EventData): eventData is MouseClickEventData {
  return eventData.type === EventType.CLICK || eventData.type === EventType.DBLCLICK;
}

/**
 * 检查是否为DOM变化事件数据
 */
export function isDomMutationEventData(eventData: EventData): eventData is DomMutationEventData {
  return eventData.type === EventType.DOM_MUTATION;
}

/**
 * 检查是否为网络请求事件数据
 */
export function isNetworkRequestEventData(eventData: EventData): eventData is NetworkRequestEventData {
  return eventData.type === EventType.NETWORK_REQUEST;
}

/**
 * 检查是否为网络响应事件数据
 */
export function isNetworkResponseEventData(eventData: EventData): eventData is NetworkResponseEventData {
  return eventData.type === EventType.NETWORK_RESPONSE;
}

/**
 * 检查是否为自定义事件数据
 */
export function isCustomEventData(eventData: EventData): eventData is CustomEventData {
  return eventData.type === EventType.CUSTOM;
}

// ========== 工具函数 ==========

/**
 * 创建键盘事件数据
 */
export function createKeyboardEventData(type: EventType.KEYDOWN | EventType.KEYUP, originalEvent: KeyboardEvent, source?: string): KeyboardEventData {
  return {
    type,
    timestamp: new Date().toISOString(),
    source,
    data: {
      key: originalEvent.key,
      code: originalEvent.code,
      ctrlKey: originalEvent.ctrlKey,
      altKey: originalEvent.altKey,
      shiftKey: originalEvent.shiftKey,
      metaKey: originalEvent.metaKey,
      repeat: originalEvent.repeat,
      location: originalEvent.location,
    },
    originalEvent,
  };
}

/**
 * 创建鼠标事件数据
 */
export function createMouseEventData(
  type: EventType.MOUSEMOVE | EventType.MOUSEDOWN | EventType.MOUSEUP | EventType.CLICK | EventType.DBLCLICK,
  originalEvent: MouseEvent,
  source?: string
): MouseMoveEventData | MouseButtonEventData | MouseClickEventData {
  const position: MousePosition = {
    x: originalEvent.clientX,
    y: originalEvent.clientY,
    clientX: originalEvent.clientX,
    clientY: originalEvent.clientY,
    pageX: originalEvent.pageX,
    pageY: originalEvent.pageY,
    screenX: originalEvent.screenX,
    screenY: originalEvent.screenY,
  };

  const baseData = {
    timestamp: new Date().toISOString(),
    source,
    originalEvent,
  };

  switch (type) {
    case EventType.MOUSEMOVE:
      return {
        ...baseData,
        type,
        data: {
          position,
          movementX: originalEvent.movementX,
          movementY: originalEvent.movementY,
          buttons: originalEvent.buttons,
        },
      } as MouseMoveEventData;

    case EventType.MOUSEDOWN:
    case EventType.MOUSEUP:
      return {
        ...baseData,
        type,
        data: {
          position,
          button: originalEvent.button,
          buttons: originalEvent.buttons,
          detail: originalEvent.detail,
        },
      } as MouseButtonEventData;

    case EventType.CLICK:
    case EventType.DBLCLICK:
      const target = originalEvent.target as Element;
      return {
        ...baseData,
        type,
        data: {
          position,
          button: originalEvent.button,
          detail: originalEvent.detail,
          target: {
            tagName: target?.tagName || "unknown",
            id: target?.id,
            className: target?.className,
            textContent: target?.textContent?.substring(0, 100), // 限制长度
          },
        },
      } as MouseClickEventData;

    default:
      throw new Error(`不支持的鼠标事件类型: ${type}`);
  }
}
