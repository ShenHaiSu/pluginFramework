export interface InternalData {
  // 初始化内部数据
  mutationCount: number;
  lastMutation: {
    count: number;
    timestamp: string;
    mutations: Array<{
      type: string;
      target: string;
      addedNodes: number;
      removedNodes: number;
    }>;
  } | null;
  trackedElements: Map<string, HTMLElement>;
}

export interface DatabaseData {
  // 持久化数据
  mutationHistory?: Array<{
    count: number;
    timestamp: string;
    mutations: Array<{
      type: string;
      target: string;
      addedNodes: number;
      removedNodes: number;
    }>;
  }>;
}
