export interface InternalData {
  // 内部运行时数据
  leftClickCount: number;
  lastLeftClick: {
    position: {
      x: number;
      y: number;
    };
    timestamp: string;
  } | null;
}

export interface DatabaseData {
  // 持久化数据
  leftClickHistory?: Array<{
    position: {
      x: number;
      y: number;
    };
    timestamp: string;
  }>;
  mouseStats?: {
    totalClicks: number;
    averageClicksPerSession: number;
    sessionStartTime: string;
  };
}