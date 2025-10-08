export interface InternalData {
  // 内部运行时数据
  keyPressCount: number;
  lastKeyPress: {
    key: string;
    code: string;
    timestamp: string;
    modifiers: string[];
  } | null;
  activeModifiers: Set<string>;
}

export interface DatabaseData {
  // 持久化数据
  keybindings?: Record<string, string>; // 快捷键映射，如 "Ctrl+S": "save"
  actionHistory?: Array<{
    action: string;
    timestamp: string;
    key?: string;
    combination?: string;
  }>;
  keyPressHistory?: Array<{
    key: string;
    code: string;
    timestamp: string;
    modifiers: string[];
  }>;
  interruptedEvents?: Array<{
    key: string;
    timestamp: string;
    interrupted: boolean;
    listener?: string;
    action?: string;
  }>;
  nonInterruptedEvents?: Array<{
    key: string;
    timestamp: string;
    interrupted: boolean;
    listener?: string;
    action?: string;
  }>;
  keyboardStats?: {
    totalKeyPresses: number;
    mostUsedKeys: Record<string, number>;
    sessionStartTime: string;
  };
}