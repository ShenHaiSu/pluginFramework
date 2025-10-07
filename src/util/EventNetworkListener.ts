import { emit, EventType } from "@/util/EventBus";
import { debug, warn, error } from "@/util/logger";

/**
 * 网络响应数据接口 - 为插件开发者提供的简化响应数据
 */
export interface NetworkResponseData {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json?: any; // 如果响应是JSON格式，自动解析后的对象
  text?: string; // 响应的文本内容
  responseTime: number; // 响应时间（毫秒）
  requestId: string; // 请求唯一标识
  timestamp: string; // 响应时间戳
  jsonContent?: any; // JSON内容的别名，与json保持一致
}

/**
 * 网络监听器 - 负责拦截和监听网络请求响应
 * 支持 fetch 和 XMLHttpRequest 两种方式
 */
export class NetworkListener {
  private isActive = false;
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;
  private requestCounter = 0;

  constructor() {
    // 保存原始方法的引用
    this.originalFetch = window.fetch;
    this.originalXMLHttpRequest = window.XMLHttpRequest;
  }

  /**
   * 启动网络监听
   */
  start(): void {
    if (this.isActive) {
      debug("网络监听器已经启动，跳过重复启动");
      return;
    }

    this.interceptFetch();
    this.interceptXMLHttpRequest();
    this.isActive = true;
    debug("网络监听器启动完成");
  }

  /**
   * 停止网络监听
   */
  stop(): void {
    if (!this.isActive) return;

    // 恢复原始方法
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXMLHttpRequest;
    
    this.isActive = false;
    debug("网络监听器已停止");
  }

  /**
   * 获取监听器状态
   */
  isListening(): boolean {
    return this.isActive;
  }

  /**
   * 拦截 fetch 请求
   */
  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const requestId = self.generateRequestId();
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      try {
        // 发射请求事件
        emit({
          type: EventType.NETWORK_REQUEST,
          timestamp: new Date().toISOString(),
          source: "NetworkListener",
          data: {
            url,
            method,
            headers: self.headersToObject(init?.headers),
            body: init?.body,
            requestId,
          },
        });

        // 执行原始请求
        const response = await self.originalFetch.call(this, input, init);
        const responseTime = Date.now() - startTime;

        // 克隆响应以便读取内容
        const responseClone = response.clone();
        
        // 处理响应数据
        await self.processResponse(response, {
          url,
          method,
          requestId,
          responseTime,
        });

        return responseClone;
      } catch (err) {
        error(`网络请求失败 (${requestId}):`, err);
        throw err;
      }
    };
  }

  /**
   * 拦截 XMLHttpRequest
   */
  private interceptXMLHttpRequest(): void {
    const self = this;
    const OriginalXHR = this.originalXMLHttpRequest;

    // 创建新的XMLHttpRequest构造函数
    function CustomXMLHttpRequest() {
      const xhr = new OriginalXHR();
      const requestId = self.generateRequestId();
      let startTime: number;
      let url: string;
      let method: string;

      // 拦截 open 方法
      const originalOpen = xhr.open;
      xhr.open = function(method_: string, url_: string | URL, async?: boolean, username?: string | null, password?: string | null) {
        method = method_.toUpperCase();
        url = typeof url_ === 'string' ? url_ : url_.href;
        return originalOpen.apply(this, [method_, url_, async ?? true, username, password]);
      };

      // 拦截 send 方法
      const originalSend = xhr.send;
      xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
        startTime = Date.now();

        // 发射请求事件
        emit({
          type: EventType.NETWORK_REQUEST,
          timestamp: new Date().toISOString(),
          source: "NetworkListener",
          data: {
            url,
            method,
            headers: self.getXHRHeaders(xhr),
            body,
            requestId,
          },
        });

        return originalSend.apply(this, [body]);
      };

      // 监听响应完成
      xhr.addEventListener('loadend', () => {
        if (xhr.readyState === 4) {
          const responseTime = Date.now() - startTime;
          
          self.processXHRResponse(xhr, {
            url,
            method,
            requestId,
            responseTime,
          });
        }
      });

      return xhr;
    }

    // 设置原型链和静态属性
    CustomXMLHttpRequest.prototype = OriginalXHR.prototype;
    Object.setPrototypeOf(CustomXMLHttpRequest, OriginalXHR);
    
    // 安全地复制静态常量，避免只读属性错误
    try {
      // 使用 Object.defineProperty 来安全地设置静态常量
      const constants = ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'];
      constants.forEach(constant => {
        try {
          Object.defineProperty(CustomXMLHttpRequest, constant, {
            value: (OriginalXHR as any)[constant],
            writable: false,
            enumerable: true,
            configurable: true
          });
        } catch (e) {
          // 如果属性已存在且不可配置，则跳过
          debug(`跳过设置XMLHttpRequest.${constant}常量: ${e}`);
        }
      });
    } catch (e) {
      // 如果整体设置失败，记录警告但不阻止执行
      warn('设置XMLHttpRequest静态常量时出现问题:', e);
    }

    // 替换全局XMLHttpRequest
    (window as any).XMLHttpRequest = CustomXMLHttpRequest;
  }

  /**
   * 处理 fetch 响应
   */
  private async processResponse(response: Response, requestInfo: {
    url: string;
    method: string;
    requestId: string;
    responseTime: number;
  }): Promise<void> {
    try {
      const headers = this.responseHeadersToObject(response.headers);
      const contentType = response.headers.get('content-type') || '';
      const timestamp = new Date().toISOString();
      
      let responseData: NetworkResponseData = {
        url: requestInfo.url,
        method: requestInfo.method,
        status: response.status,
        statusText: response.statusText,
        headers,
        responseTime: requestInfo.responseTime,
        requestId: requestInfo.requestId,
        timestamp,
      };

      // 尝试解析响应内容
      const text = await response.text();
      responseData.text = text;

      // 如果是 JSON 格式，尝试解析
      if (contentType.includes('application/json') || this.isJsonString(text)) {
        try {
          const jsonData = JSON.parse(text);
          responseData.json = jsonData;
          responseData.jsonContent = jsonData; // 添加jsonContent别名
        } catch (err) {
          debug(`JSON 解析失败 (${requestInfo.requestId}):`, err);
        }
      }

      // 发射响应事件
      emit({
        type: EventType.NETWORK_RESPONSE,
        timestamp,
        source: "NetworkListener",
        data: responseData,
      });

    } catch (err) {
      error(`处理响应失败 (${requestInfo.requestId}):`, err);
    }
  }

  /**
   * 处理 XMLHttpRequest 响应
   */
  private processXHRResponse(xhr: XMLHttpRequest, requestInfo: {
    url: string;
    method: string;
    requestId: string;
    responseTime: number;
  }): void {
    try {
      const headers = this.parseXHRResponseHeaders(xhr.getAllResponseHeaders());
      const contentType = xhr.getResponseHeader('content-type') || '';
      const timestamp = new Date().toISOString();
      
      let responseData: NetworkResponseData = {
        url: requestInfo.url,
        method: requestInfo.method,
        status: xhr.status,
        statusText: xhr.statusText,
        headers,
        responseTime: requestInfo.responseTime,
        requestId: requestInfo.requestId,
        text: xhr.responseText,
        timestamp,
      };

      // 如果是 JSON 格式，尝试解析
      if (contentType.includes('application/json') || this.isJsonString(xhr.responseText)) {
        try {
          const jsonData = JSON.parse(xhr.responseText);
          responseData.json = jsonData;
          responseData.jsonContent = jsonData; // 添加jsonContent别名
        } catch (err) {
          debug(`JSON 解析失败 (${requestInfo.requestId}):`, err);
        }
      }

      // 发射响应事件
      emit({
        type: EventType.NETWORK_RESPONSE,
        timestamp,
        source: "NetworkListener",
        data: responseData,
      });

    } catch (err) {
      error(`处理 XHR 响应失败 (${requestInfo.requestId}):`, err);
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * 将 Headers 对象转换为普通对象
   */
  private headersToObject(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (!headers) return result;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else {
      Object.assign(result, headers);
    }

    return result;
  }

  /**
   * 将 Response Headers 转换为普通对象
   */
  private responseHeadersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 获取 XMLHttpRequest 的请求头
   */
  private getXHRHeaders(xhr: XMLHttpRequest): Record<string, string> {
    // XMLHttpRequest 无法获取已设置的请求头，返回空对象
    return {};
  }

  /**
   * 解析 XMLHttpRequest 响应头字符串
   */
  private parseXHRResponseHeaders(headerStr: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (!headerStr) return headers;

    headerStr.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        headers[parts[0].toLowerCase()] = parts[1];
      }
    });

    return headers;
  }

  /**
   * 判断字符串是否为 JSON 格式
   */
  private isJsonString(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    
    const trimmed = str.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }
}

// 导出单例实例
export const networkListener = new NetworkListener();