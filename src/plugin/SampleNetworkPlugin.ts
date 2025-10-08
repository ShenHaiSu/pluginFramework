import type { InternalData, DatabaseData } from "@/composable/SampleNetworkPlugin/types";

import { PluginBase } from "@/util/PluginBase";
import { EventBus, off, on, EventType, EventData } from "@/util/EventBus";
import { NetworkResponseEventData } from "@/util/EventTypes";
import { info, debug } from "@/util/logger";

/**
 * 网络响应体监听器示例插件
 * 演示如何使用网络监听器获取响应体JSON内容
 */
export class SampleNetworkPlugin extends PluginBase<InternalData, DatabaseData> {
  private eventListenerId: string | null = null;

  constructor() {
    super({
      name: "networkExamplePlugin",
      describe: "网络响应体监听器示例插件，演示如何获取网络响应的JSON内容",
      enable: true,
      canDisable: true,
      tags: ["network", "example", "json"],
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
      this.databaseData = savedData as DatabaseData;
    }

    // 初始化内部数据
    this.internalData = {
      responseCount: 0,
      jsonResponseCount: 0,
      errorResponseCount: 0,
      lastApiResponse: null,
      userProfiles: [],
    };

    // 设置网络响应监听器
    this.setupNetworkListener();

    info(`${this.name} 插件初始化完成`);
  }

  /**
   * 设置网络监听器
   */
  private setupNetworkListener(): void {
    // 监听网络响应事件
    this.eventListenerId = on(EventType.NETWORK_RESPONSE, (eventData: EventData) => {
      this.handleNetworkResponse(eventData as NetworkResponseEventData);
    });

    debug(`${this.name} 插件已设置网络响应监听器 (ID: ${this.eventListenerId})`);
  }

  /**
   * 处理网络响应事件
   * @param eventData 网络响应事件数据
   */
  private handleNetworkResponse(eventData: NetworkResponseEventData): void {
    const { data } = eventData;

    // 更新统计信息
    this.internalData.responseCount++;

    debug(`收到网络响应: ${data.method} ${data.url} - 状态: ${data.status}`);

    // 处理JSON响应
    if (data.jsonContent) {
      this.internalData.jsonResponseCount++;
      this.handleJsonResponse(data);
    }

    // 处理POST请求
    if (data.method === "POST") {
      this.handlePostRequest(data);
    }

    // 处理错误响应
    if (data.status >= 400) {
      this.internalData.errorResponseCount++;
      this.handleErrorResponse(data);
    }

    // 性能监控
    if (data.responseTime > 3000) {
      info(`检测到慢请求: ${data.url} - 响应时间: ${data.responseTime}ms`);
    }

    // 保存最新的API响应
    if (data.url.includes("/api/")) {
      this.internalData.lastApiResponse = {
        url: data.url,
        method: data.method || 'GET',
        status: data.status,
        timestamp: data.timestamp,
        responseTime: data.responseTime || 0,
        jsonContent: data.jsonContent,
      };
    }
  }

  /**
   * 处理JSON响应
   * @param responseData 响应数据
   */
  private handleJsonResponse(responseData: any): void {
    debug(`处理JSON响应: ${responseData.url}`);

    // 解析 /newReport 接口的 JSON 响应
    if (responseData.url.includes("/newReport") && responseData.jsonContent) {
      const reportData = responseData.jsonContent;
      info(`收到 /newReport 响应: ${JSON.stringify(reportData)}`);
    }
  }

  /**
   * 处理POST请求
   * @param responseData 响应数据
   */
  private handlePostRequest(responseData: any): void {
    debug(`处理POST请求: ${responseData.url}`);

    // 示例：监控表单提交
    if (responseData.url.includes("/api/submit") && responseData.status === 200) {
      info(`表单提交成功: ${responseData.url}`);
    }

    // 示例：监控登录请求
    if (responseData.url.includes("/api/login")) {
      if (responseData.status === 200 && responseData.jsonContent) {
        info(`用户登录成功`);

        // 保存登录信息
        this.databaseData.lastLogin = {
          timestamp: responseData.timestamp,
          success: true,
        };
        this.saveData();
      } else {
        info(`用户登录失败，状态码: ${responseData.status}`);
      }
    }
  }

  /**
   * 处理错误响应
   * @param responseData 响应数据
   */
  private handleErrorResponse(responseData: any): void {
    info(`检测到错误响应: ${responseData.method} ${responseData.url} - 状态: ${responseData.status}`);

    // 记录错误信息
    if (!this.databaseData.errorLog) {
      this.databaseData.errorLog = [];
    }

    this.databaseData.errorLog.push({
      url: responseData.url,
      method: responseData.method,
      status: responseData.status,
      timestamp: responseData.timestamp,
      textContent: responseData.textContent,
    });

    // 保持错误日志不超过100条
    if (this.databaseData.errorLog.length > 100) {
      this.databaseData.errorLog = this.databaseData.errorLog.slice(-100);
    }

    this.saveData();
  }

  /**
   * 获取插件统计信息
   * @returns 统计信息对象
   */
  getStats(): any {
    return {
      responseCount: this.internalData.responseCount,
      jsonResponseCount: this.internalData.jsonResponseCount,
      errorResponseCount: this.internalData.errorResponseCount,
      userProfilesCount: this.internalData.userProfiles?.length || 0,
      lastApiResponse: this.internalData.lastApiResponse,
    };
  }

  /**
   * 获取用户配置文件列表
   * @returns 用户配置文件数组
   */
  getUserProfiles(): any[] {
    return this.internalData.userProfiles || [];
  }

  /**
   * 清除错误日志
   */
  clearErrorLog(): void {
    this.databaseData.errorLog = [];
    this.saveData();
    info(`${this.name} 插件错误日志已清除`);
  }

  /**
   * 销毁插件，清理资源
   */
  destroy(): void {
    // 移除事件总线监听器
    if (this.eventListenerId) {
      off(EventType.NETWORK_RESPONSE, this.eventListenerId);
      this.eventListenerId = null;
      info(`${this.name} 插件已移除网络响应监听器`);
    }

    // 清理内部数据
    this.internalData = {
      responseCount: 0,
      jsonResponseCount: 0,
      errorResponseCount: 0,
      lastApiResponse: null,
      userProfiles: []
    };

    info(`${this.name} 插件已销毁`);
  }
}
