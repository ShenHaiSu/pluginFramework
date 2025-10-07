import { PluginBase } from "@/util/PluginBase";
import { info, error } from "@/util/logger";

export class NetworkPlugin extends PluginBase {
  constructor() {
    super("network", "监听和拦截网络请求与响应", true, false, ["network", "request", "response"]);
  }

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
      requestCount: 0,
      responseCount: 0,
      lastRequest: null,
      lastResponse: null,
    };

    // 设置网络拦截
    this.setupNetworkInterception();
  }

  private setupNetworkInterception(): void {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      this.internalData.requestCount++;
      this.internalData.lastRequest = {
        url: args[0].toString(),
        method: args[1]?.method || "GET",
        timestamp: new Date().toISOString(),
      };

      const response = await originalFetch(...args);

      // 克隆响应以便读取
      const clonedResponse = response.clone();
      try {
        const responseBody = await clonedResponse.text();
        this.internalData.responseCount++;
        this.internalData.lastResponse = {
          url: args[0].toString(),
          status: response.status,
          body: responseBody,
          timestamp: new Date().toISOString(),
        };

        // 存储重要响应到持久化数据
        this.databaseData.last10Responses = this.databaseData.last10Responses || [];
        this.databaseData.last10Responses.push(this.internalData.lastResponse);
        if (this.databaseData.last10Responses.length > 10) {
          this.databaseData.last10Responses.shift();
        }

        // 保存数据
        await this.saveData();
      } catch (err) {
        error("读取响应体错误:", err);
      }

      return response;
    };
  }

  // 获取网络统计信息
  getNetworkStats() {
    return {
      requestCount: this.internalData.requestCount,
      responseCount: this.internalData.responseCount,
      lastRequest: this.internalData.lastRequest,
      lastResponse: this.internalData.lastResponse,
    };
  }
}
