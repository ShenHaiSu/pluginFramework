/**
 * Logger 模块 - 提供易用的日志记录功能
 * 支持不同级别的日志输出，带有颜色区分和格式化
 */

// 使用示例（注释形式）
/*
// 基本使用
import { debug, info, warn, error, fatal } from './util/logger';

debug('这是调试信息');
info('这是普通信息');
warn('这是警告信息');
error('这是错误信息');
fatal('这是致命错误');

// 使用 Logger 类
import { Logger, LogLevel } from './util/logger';

const logger = new Logger({
  level: LogLevel.DEBUG,
  prefix: 'MyApp',
  enableColors: true
});

logger.info('应用启动');
logger.error('发生错误', { code: 500, message: 'Internal Server Error' });

// 创建子 Logger
const moduleLogger = logger.createChild('UserModule');
moduleLogger.info('用户登录成功');

// 分组日志
logger.group('API 调用');
logger.info('发送请求');
logger.info('接收响应');
logger.groupEnd();

// 计时
logger.time('数据处理');
// ... 一些操作
logger.timeEnd('数据处理');
*/

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// 日志级别配置
interface LogLevelConfig {
  name: string;
  color: string;
  bgColor?: string;
  emoji: string;
}

// 日志配置接口
export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
  prefix?: string;
  dateFormat?: string;
}

// 日志级别配置映射
const LOG_LEVEL_CONFIGS: Record<LogLevel, LogLevelConfig> = {
  [LogLevel.DEBUG]: {
    name: "DEBUG",
    color: "#6B7280",
    emoji: "🔍",
  },
  [LogLevel.INFO]: {
    name: "INFO",
    color: "#3B82F6",
    emoji: "ℹ️",
  },
  [LogLevel.WARN]: {
    name: "WARN",
    color: "#F59E0B",
    emoji: "⚠️",
  },
  [LogLevel.ERROR]: {
    name: "ERROR",
    color: "#EF4444",
    emoji: "❌",
  },
  [LogLevel.FATAL]: {
    name: "FATAL",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    emoji: "💀",
  },
};

/**
 * Logger 类 - 核心日志记录器
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableTimestamp: true,
      enableColors: true,
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      ...config,
    };
  }

  /**
   * 更新配置
   */
  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 检查是否应该输出指定级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 格式化日志消息前缀
   */
  private formatMessage(
    level: LogLevel,
    message: string
  ): {
    fullMessage: string;
    levelPart: string;
    otherParts: string;
  } {
    const levelConfig = LOG_LEVEL_CONFIGS[level];
    const timestamp = this.config.enableTimestamp ? `[${this.formatTimestamp()}]` : "";
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : "";
    const levelName = `[${levelConfig.name}]`;
    const emoji = levelConfig.emoji;

    const otherParts = `${timestamp} ${prefix}`.trim();
    const levelPart = `${levelName}`;
    const messagePart = `${emoji} ${message}`;

    const fullMessage = `${otherParts} ${levelPart} ${messagePart}`.replace(/\s+/g, " ").trim();

    return {
      fullMessage,
      levelPart,
      otherParts: `${otherParts} %c${levelPart}%c ${messagePart}`.replace(/\s+/g, " ").trim(),
    };
  }

  /**
   * 获取控制台样式 - 只为LEVEL部分提供颜色
   */
  private getConsoleStyles(level: LogLevel): { levelStyle: string; defaultStyle: string } {
    if (!this.config.enableColors) {
      return { levelStyle: "", defaultStyle: "" };
    }

    const levelConfig = LOG_LEVEL_CONFIGS[level];
    let levelStyle = `color: ${levelConfig.color}; font-weight: bold;`;

    if (levelConfig.bgColor) {
      levelStyle += ` background-color: ${levelConfig.bgColor}; padding: 2px 4px; border-radius: 3px;`;
    }

    const defaultStyle = "color: inherit; font-weight: normal; background-color: inherit; padding: 0;";

    return { levelStyle, defaultStyle };
  }

  /**
   * 核心日志输出方法
   */
  private log(level: LogLevel, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // 如果有参数，将第一个参数作为主消息，其余作为额外参数
    const message = args.length > 0 ? String(args[0]) : "";
    const restArgs = args.slice(1);

    const messageData = this.formatMessage(level, message);
    const styles = this.getConsoleStyles(level);

    // 根据日志级别选择合适的控制台方法，直接将额外参数追加到输出中
    switch (level) {
      case LogLevel.DEBUG:
        if (this.config.enableColors) {
          console.debug(messageData.otherParts, styles.levelStyle, styles.defaultStyle, ...restArgs);
        } else {
          console.debug(messageData.fullMessage, ...restArgs);
        }
        break;
      case LogLevel.INFO:
        if (this.config.enableColors) {
          console.info(messageData.otherParts, styles.levelStyle, styles.defaultStyle, ...restArgs);
        } else {
          console.info(messageData.fullMessage, ...restArgs);
        }
        break;
      case LogLevel.WARN:
        if (this.config.enableColors) {
          console.warn(messageData.otherParts, styles.levelStyle, styles.defaultStyle, ...restArgs);
        } else {
          console.warn(messageData.fullMessage, ...restArgs);
        }
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        if (this.config.enableColors) {
          console.error(messageData.otherParts, styles.levelStyle, styles.defaultStyle, ...restArgs);
        } else {
          console.error(messageData.fullMessage, ...restArgs);
        }
        break;
    }
  }

  /**
   * DEBUG 级别日志
   */
  public debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  /**
   * INFO 级别日志
   */
  public info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  /**
   * WARN 级别日志
   */
  public warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  /**
   * ERROR 级别日志
   */
  public error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }

  /**
   * FATAL 级别日志
   */
  public fatal(...args: any[]): void {
    this.log(LogLevel.FATAL, ...args);
  }

  /**
   * 创建子 Logger，带有特定前缀
   */
  public createChild(prefix: string): Logger {
    const childPrefix = this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix;
    return new Logger({
      ...this.config,
      prefix: childPrefix,
    });
  }

  /**
   * 分组日志开始
   */
  public group(label: string): void {
    const messageData = this.formatMessage(LogLevel.INFO, label);
    console.group(messageData.fullMessage);
  }

  /**
   * 分组日志结束
   */
  public groupEnd(): void {
    console.groupEnd();
  }

  /**
   * 表格形式输出数据
   */
  public table(data: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.table(data);
    }
  }

  /**
   * 计时开始
   */
  public time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  /**
   * 计时结束
   */
  public timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }
}

// 默认 Logger 实例
const defaultLogger = new Logger();

// 导出便捷函数
export const debug = (...args: any[]) => defaultLogger.debug(...args);
export const info = (...args: any[]) => defaultLogger.info(...args);
export const warn = (...args: any[]) => defaultLogger.warn(...args);
export const error = (...args: any[]) => defaultLogger.error(...args);
export const fatal = (...args: any[]) => defaultLogger.fatal(...args);

// 导出配置函数
export const setLogLevel = (level: LogLevel) => defaultLogger.setLevel(level);
export const setLoggerConfig = (config: Partial<LoggerConfig>) => defaultLogger.setConfig(config);

// 导出创建 Logger 的工厂函数
export const createLogger = (config?: Partial<LoggerConfig>) => new Logger(config);

// 导出默认实例
export default defaultLogger;
