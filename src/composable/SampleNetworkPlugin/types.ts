export interface InternalData {
  // 内部运行时数据
  responseCount: number;
  jsonResponseCount: number;
  errorResponseCount: number;
  lastApiResponse: {
    url: string;
    method: string;
    status: number;
    timestamp: string;
    responseTime: number;
    jsonContent?: any;
  } | null;
  userProfiles: Array<{
    id: string | number;
    name?: string;
    email?: string;
    [key: string]: any;
  }>;
}

export interface DatabaseData {
  // 持久化数据
  lastLogin?: {
    timestamp: string;
    success: boolean;
  };
  errorLog?: Array<{
    url: string;
    method: string;
    status: number;
    timestamp: string;
    error?: string;
    textContent?: string;
  }>;
  apiCallHistory?: Array<{
    url: string;
    method: string;
    status: number;
    timestamp: string;
    responseTime: number;
  }>;
  networkStats?: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    sessionStartTime: string;
  };
  userProfilesCache?: Array<{
    id: string | number;
    name?: string;
    email?: string;
    cachedAt: string;
    [key: string]: any;
  }>;
}