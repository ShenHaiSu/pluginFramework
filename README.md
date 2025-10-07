# Plugin Framework

一个基于 TypeScript 和事件驱动架构的现代化插件框架，专为构建可扩展的 Web 应用和油猴脚本而设计。

## 📋 项目简介

Plugin Framework 是一个轻量级、高性能的插件化框架，采用事件驱动架构和 TypeScript 强类型支持。框架提供了完整的插件生命周期管理、事件总线系统、数据持久化和多种内置监听器，让开发者能够快速构建模块化的 Web 应用。

**核心优势：**

- **事件驱动架构**：基于高性能事件总线，支持优先级调度、短路机制和执行上下文管理
- **强类型支持**：完整的 TypeScript 类型定义，提供卓越的开发体验和代码安全性
- **插件生命周期管理**：支持插件动态启用/禁用、状态持久化和依赖管理
- **多维度事件监听**：内置键盘、鼠标、DOM、网络等专业监听器
- **数据持久化**：基于 IndexedDB 的高效数据存储系统
- **油猴脚本支持**：一键构建为 Tampermonkey 兼容的用户脚本
- **高性能构建**：使用 Rollup 进行模块打包和代码优化

## ✨ 核心特性

### 🏗️ 事件驱动架构
- **EventBus 事件总线**：统一的事件管理中心，支持事件发布/订阅模式
- **优先级调度**：监听器支持优先级设置，确保关键事件优先处理
- **短路机制**：监听器可以中断事件传播链，实现精确的事件控制
- **执行上下文**：提供事件处理过程中的上下文信息和状态管理

### 🔌 插件系统
- **PluginBase 基类**：标准化的插件开发接口和生命周期管理
- **动态状态管理**：支持插件运行时启用/禁用，状态自动持久化
- **插件间通信**：通过事件总线实现插件间的松耦合通信
- **数据隔离**：每个插件拥有独立的内存数据和持久化数据空间

### 📊 数据持久化
- **IndexedDB 存储**：高性能的浏览器本地数据库存储
- **插件数据管理**：自动管理插件配置和运行时数据
- **状态同步**：插件启用状态在浏览器会话间保持一致

### 🎯 专业监听器
- **KeyboardListener**：键盘事件监听，支持快捷键绑定和组合键检测
- **MouseListener**：鼠标事件监听，包括移动、点击、滚动等操作
- **DomObserver**：基于 MutationObserver 的 DOM 变化监听
- **NetworkListener**：网络请求拦截，支持 fetch 和 XMLHttpRequest

## 🏗️ 架构设计

### 核心组件关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Framework                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │   插件层    │    │   事件总线   │    │   监听器层      │ │
│  │             │◄──►│              │◄──►│                 │ │
│  │ PluginBase  │    │  EventBus    │    │ EventEmitter    │ │
│  │   子类      │    │              │    │   各种监听器    │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
│         │                   │                      │        │
│         ▼                   ▼                      ▼        │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │  数据持久化 │    │   类型系统   │    │   构建工具      │ │
│  │             │    │              │    │                 │ │
│  │ IndexedDB   │    │ TypeScript   │    │ Rollup +        │ │
│  │   存储      │    │   类型定义   │    │ 油猴脚本生成    │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 项目结构

```
pluginFramework/
├── src/                           # 源代码目录
│   ├── index.ts                   # 框架入口文件，负责初始化流程
│   │
│   ├── plugin/                    # 插件实现目录
│   │   ├── index.ts              # 插件导出和注册中心
│   │   ├── DomPlugin.ts          # DOM 变化监听插件
│   │   ├── KeyboardPlugin.ts     # 键盘事件处理插件
│   │   ├── MousePlugin.ts        # 鼠标事件处理插件
│   │   └── NetworkExamplePlugin.ts # 网络监听示例插件
│   │
│   ├── util/                      # 核心工具类目录
│   │   ├── EventBus.ts           # 事件总线核心实现
│   │   ├── EventEmitter.ts       # 事件发射器，整合各监听器
│   │   ├── EventTypes.ts         # 事件类型定义和接口
│   │   │
│   │   ├── EventDomObserver.ts   # DOM 变化观察者
│   │   ├── EventKeyboardListener.ts # 键盘事件监听器
│   │   ├── EventMouseListener.ts # 鼠标事件监听器
│   │   ├── EventNetworkListener.ts # 网络请求监听器
│   │   │
│   │   ├── PluginBase.ts         # 插件基类定义
│   │   ├── installedPlugins.ts   # 插件实例管理
│   │   ├── db.ts                 # IndexedDB 数据库操作
│   │   └── logger.ts             # 日志系统
│   │
│   └── composable/                # 可组合函数目录（预留扩展）
│
├── dist/                          # 构建输出目录
├── rollup.config.js              # Rollup 构建配置
├── postbuild.mjs                 # 构建后处理脚本
├── postBuildConfig.mjs           # 油猴脚本配置
├── tsconfig.json                 # TypeScript 配置
└── package.json                  # 项目依赖和脚本配置
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** 或 **pnpm** 包管理器
- 现代浏览器支持（Chrome 88+, Firefox 78+, Safari 14+）

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

### 开发模式

```bash
# 启动监听模式，文件变化时自动重新构建
npm run watch
```

### 构建项目

```bash
# 构建生产版本
npm run build

# 构建并生成油猴脚本
npm run postbuild
```

构建完成后，在 `dist/` 目录下会生成：
- `bundle.js` - 标准 JavaScript 模块
- `bundle.user.js` - 油猴脚本版本（包含用户脚本头信息）

## 🔌 内置插件详解

### 1. NetworkExamplePlugin - 网络监听插件

**功能特性：**
- 拦截所有 `fetch` 和 `XMLHttpRequest` 请求
- 自动解析 JSON 响应内容
- 记录请求响应时间和状态信息
- 提供详细的网络统计数据

**使用场景：**
- API 调试和性能分析
- 网络请求日志记录
- 数据抓取和分析
- 接口监控和统计

**核心代码示例：**
```typescript
// 监听网络响应事件
on(EventType.NETWORK_RESPONSE, (eventData) => {
  const responseData = eventData.data as NetworkResponseData;
  console.log(`请求 ${responseData.url} 完成，状态：${responseData.status}`);
  
  // 处理 JSON 响应
  if (responseData.json) {
    this.processJsonResponse(responseData.json);
  }
}, {
  priority: EVENT_PRIORITY.NORMAL,
  source: this.name
});
```

### 2. DomPlugin - DOM 监听插件

**功能特性：**
- 基于 `MutationObserver` 监听 DOM 结构变化
- 支持元素增删改查的精确监听
- 可配置监听范围和事件类型
- 提供 DOM 操作历史记录

**使用场景：**
- 单页应用（SPA）动态内容监听
- 页面元素变化追踪
- 自动化测试和页面分析
- 内容注入和修改检测

### 3. KeyboardPlugin - 键盘事件插件

**功能特性：**
- 全局键盘事件监听
- 支持组合键和修饰键检测
- 快捷键绑定和自定义操作
- 按键统计和行为分析

**使用场景：**
- 自定义快捷键功能
- 键盘操作统计分析
- 游戏控制和交互
- 无障碍访问支持

### 4. MousePlugin - 鼠标事件插件

**功能特性：**
- 鼠标移动、点击、滚动事件监听
- 精确的坐标位置记录
- 鼠标手势识别支持
- 点击热区统计分析

**使用场景：**
- 用户交互行为分析
- 鼠标手势功能实现
- 页面热力图生成
- 自动化操作录制

## 🛠️ 插件开发指南

### 创建自定义插件

#### 1. 继承 PluginBase 基类

```typescript
import { PluginBase, PluginConfig } from "@/util/PluginBase";
import { on, off, EventType } from "@/util/EventBus";
import { info, debug } from "@/util/logger";

/**
 * 自定义插件示例
 * 演示插件的基本结构和生命周期管理
 */
export class MyCustomPlugin extends PluginBase {
  private eventListenerId: string | null = null;

  constructor() {
    // 调用父类构造函数，传入插件配置
    super({
      name: "myCustomPlugin",
      describe: "我的自定义插件，演示插件开发的基本模式",
      enable: true,        // 默认启用
      canDisable: true,    // 允许用户禁用
      tags: ["custom", "example", "demo"]
    });
  }

  /**
   * 插件初始化函数
   * 在框架启动时自动调用
   */
  async init(): Promise<void> {
    info(`初始化 ${this.name} 插件`);

    // 从数据库加载保存的数据
    const savedData = await this.loadSavedData();
    if (savedData) {
      this.databaseData = savedData;
      debug(`加载了 ${this.name} 的保存数据`);
    }

    // 设置默认配置
    this.setupDefaultConfig();

    // 注册事件监听器
    this.setupEventListeners();

    // 执行插件特定的初始化逻辑
    this.initializePlugin();

    info(`${this.name} 插件初始化完成`);
  }

  /**
   * 设置默认配置
   */
  private setupDefaultConfig(): void {
    // 设置内存数据（不持久化）
    this.internalData = {
      startTime: Date.now(),
      eventCount: 0,
      isActive: true
    };

    // 设置持久化数据的默认值
    if (!this.databaseData.config) {
      this.databaseData.config = {
        autoSave: true,
        logLevel: "info",
        maxEvents: 1000
      };
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听自定义事件
    this.eventListenerId = on(EventType.CUSTOM, (eventData) => {
      return this.handleCustomEvent(eventData);
    }, {
      priority: 10,           // 设置优先级
      source: this.name,      // 标识监听器来源
      once: false            // 不是一次性监听器
    });

    debug(`${this.name} 事件监听器设置完成`);
  }

  /**
   * 处理自定义事件
   */
  private handleCustomEvent(eventData: any): boolean | void {
    this.internalData.eventCount++;
    
    // 处理事件逻辑
    debug(`${this.name} 处理自定义事件:`, eventData);

    // 如果需要阻止其他监听器处理此事件，返回 true
    // return true;
  }

  /**
   * 插件特定的初始化逻辑
   */
  private initializePlugin(): void {
    // 在这里实现插件的核心功能
    debug(`${this.name} 核心功能初始化`);
  }

  /**
   * 加载保存的数据
   */
  private async loadSavedData(): Promise<Record<string, any> | null> {
    const db = await import("@/util/db");
    return await db.getPluginData(this.name);
  }

  /**
   * 保存插件数据
   * 可以在需要时调用此方法
   */
  async savePluginData(): Promise<void> {
    await this.saveData();
    debug(`${this.name} 数据已保存`);
  }

  /**
   * 获取其他插件实例
   * 用于插件间通信
   */
  private getOtherPlugin<T extends PluginBase>(pluginName: string): T | undefined {
    return this.getPlugin<T>(pluginName);
  }

  /**
   * 清理资源
   * 在插件禁用时调用
   */
  cleanup(): void {
    // 移除事件监听器
    if (this.eventListenerId) {
      off(EventType.CUSTOM, this.eventListenerId);
      this.eventListenerId = null;
    }

    // 保存数据
    this.savePluginData();

    info(`${this.name} 插件已清理`);
  }
}
```

#### 2. 注册插件

在 `src/plugin/index.ts` 中注册新插件：

```typescript
import { DomPlugin } from "./DomPlugin";
import { KeyboardPlugin } from "./KeyboardPlugin";
import { MousePlugin } from "./MousePlugin";
import { NetworkExamplePlugin } from "./NetworkExamplePlugin";
import { MyCustomPlugin } from "./MyCustomPlugin"; // 导入自定义插件

/**
 * 插件类数组
 * 框架会自动实例化这里注册的所有插件
 */
export const pluginClasses = [
  DomPlugin,
  KeyboardPlugin,
  MousePlugin,
  NetworkExamplePlugin,
  MyCustomPlugin,  // 添加到插件列表
];
```

### 插件基类 API 详解

#### 基本属性

```typescript
interface PluginConfig {
  name: string;        // 插件唯一标识符
  describe: string;    // 插件描述信息
  enable?: boolean;    // 是否默认启用
  canDisable?: boolean; // 是否允许用户禁用
  tags?: string[];     // 插件标签，用于分类和搜索
}
```

#### 数据管理

```typescript
// 内存数据（不持久化，重启后丢失）
this.internalData: Record<string, any>

// 持久化数据（自动保存到 IndexedDB）
this.databaseData: Record<string, any>

// 保存数据到数据库
await this.saveData(): Promise<void>
```

#### 插件间通信

```typescript
// 获取其他插件实例
const otherPlugin = this.getPlugin<OtherPluginType>("pluginName");

// 通过事件总线发送消息
import { emit, EventType } from "@/util/EventBus";
emit({
  type: EventType.CUSTOM,
  timestamp: new Date().toISOString(),
  source: this.name,
  data: {
    eventName: "myCustomEvent",
    payload: { message: "Hello from plugin!" }
  }
});
```

## 📊 事件系统详解

### EventBus 事件总线

事件总线是框架的核心组件，提供了高性能的事件发布/订阅机制。

#### 核心特性

1. **优先级调度**：监听器按优先级排序执行
2. **短路机制**：监听器可以中断事件传播
3. **执行上下文**：提供事件处理过程中的上下文信息
4. **异步支持**：支持异步事件处理
5. **错误隔离**：单个监听器错误不影响其他监听器

#### 事件类型

```typescript
enum EventType {
  // 键盘事件
  KEYDOWN = "keydown",
  KEYUP = "keyup", 
  KEYBINDING = "keybinding",

  // 鼠标事件
  MOUSEMOVE = "mousemove",
  MOUSEDOWN = "mousedown",
  MOUSEUP = "mouseup",
  CLICK = "click",
  DBLCLICK = "dblclick",

  // DOM 事件
  DOM_MUTATION = "dom_mutation",

  // 网络事件
  NETWORK_REQUEST = "network_request",
  NETWORK_RESPONSE = "network_response",

  // 自定义事件
  CUSTOM = "custom"
}
```

#### 使用示例

```typescript
import { on, off, emit, EventType } from "@/util/EventBus";

// 注册事件监听器
const listenerId = on(EventType.KEYDOWN, (eventData) => {
  console.log("键盘按下:", eventData.data.key);
  
  // 返回 true 可以中断后续监听器的执行
  if (eventData.data.key === "Escape") {
    return true; // 短路中断
  }
}, {
  priority: 10,        // 优先级（数字越大优先级越高）
  source: "myPlugin",  // 监听器来源标识
  once: false         // 是否只执行一次
});

// 发射自定义事件
emit({
  type: EventType.CUSTOM,
  timestamp: new Date().toISOString(),
  source: "myPlugin",
  data: {
    eventName: "userAction",
    payload: { action: "click", target: "button" }
  }
});

// 移除事件监听器
off(EventType.KEYDOWN, listenerId);
```

### 事件数据接口

每种事件类型都有对应的数据接口，提供类型安全的事件处理：

```typescript
// 键盘事件数据
interface KeyboardEventData extends EventData {
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

// 网络响应事件数据
interface NetworkResponseEventData extends EventData {
  type: EventType.NETWORK_RESPONSE;
  data: {
    url: string;
    method: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    json?: any;
    text?: string;
    responseTime: number;
    requestId: string;
    timestamp: string;
  };
}
```

## 💾 数据持久化系统

### IndexedDB 存储

框架使用 IndexedDB 提供高性能的本地数据存储：

```typescript
import * as db from "@/util/db";

// 保存插件数据
await db.savePluginData("pluginName", {
  config: { theme: "dark" },
  userPreferences: { autoSave: true }
});

// 获取插件数据
const data = await db.getPluginData("pluginName");

// 获取所有插件数据
const allData = await db.getAllPluginData();

// 插件状态管理
await db.savePluginStatus("pluginName", false); // 禁用插件
const isEnabled = await db.getPluginStatus("pluginName");
```

### 数据结构

```typescript
// 插件数据存储结构
interface PluginDataRecord {
  name: string;                    // 插件名称
  data: Record<string, any>;       // 插件数据
}

// 插件状态存储结构
interface PluginStatusRecord {
  name: string;                    // 插件名称
  enable: boolean;                 // 启用状态
}
```

## 📝 日志系统

框架提供了完善的分级日志系统：

```typescript
import { debug, info, warn, error, fatal, createLogger } from "@/util/logger";

// 基本日志记录
debug("调试信息");
info("普通信息");
warn("警告信息");
error("错误信息");
fatal("致命错误");

// 创建带前缀的子 Logger
const moduleLogger = createLogger({ prefix: "MyModule" });
moduleLogger.info("这是模块日志"); // 输出: [MyModule] 这是模块日志
```

## 🎯 油猴脚本配置

### 配置文件

在 `postBuildConfig.mjs` 中配置油猴脚本的元数据：

```javascript
export default {
  userscript: {
    name: "Plugin Framework Userscript",
    namespace: "http://tampermonkey.net/",
    version: () => "1.0.0",
    description: "基于TypeScript和事件驱动架构的插件框架",
    author: "Your Name",
    match: ["http://*/*", "https://*/*"],
    grant: ["none"],
    // 可以添加更多油猴脚本配置
    require: [],
    resource: {},
    connect: [],
  },
};
```

### 构建流程

```bash
# 1. 构建 JavaScript 模块
npm run build

# 2. 生成油猴脚本版本
npm run postbuild
```

构建完成后会生成两个文件：
- `dist/bundle.js` - 标准模块版本
- `dist/bundle.user.js` - 油猴脚本版本

## 🔧 高级主题

### 插件间通信

插件可以通过多种方式进行通信：

#### 1. 事件总线通信

```typescript
// 插件 A 发送消息
emit({
  type: EventType.CUSTOM,
  timestamp: new Date().toISOString(),
  source: "pluginA",
  data: {
    eventName: "dataUpdate",
    payload: { newData: "some data" }
  }
});

// 插件 B 接收消息
on(EventType.CUSTOM, (eventData) => {
  if (eventData.data.eventName === "dataUpdate") {
    console.log("收到数据更新:", eventData.data.payload);
  }
}, { source: "pluginB" });
```

#### 2. 直接插件引用

```typescript
// 在插件中获取其他插件实例
const networkPlugin = this.getPlugin<NetworkExamplePlugin>("networkExamplePlugin");
if (networkPlugin) {
  // 直接调用其他插件的方法或访问数据
  const networkData = networkPlugin.databaseData;
}
```

### 性能优化

#### 1. 事件监听器优化

```typescript
// 使用合适的优先级
on(EventType.MOUSEMOVE, handler, { 
  priority: 1  // 低优先级，避免阻塞重要事件
});

// 使用一次性监听器
on(EventType.KEYDOWN, handler, { 
  once: true  // 执行一次后自动移除
});

// 及时清理监听器
off(EventType.MOUSEMOVE, listenerId);
```

#### 2. 数据存储优化

```typescript
// 批量保存数据，避免频繁的数据库操作
class MyPlugin extends PluginBase {
  private saveTimer: number | null = null;

  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = setTimeout(() => {
      this.saveData();
      this.saveTimer = null;
    }, 1000); // 延迟 1 秒保存
  }
}
```

### 调试技巧

#### 1. 使用浏览器开发者工具

```typescript
// 在全局对象上暴露框架实例
(window as any).pluginFramework = {
  installedPlugins,
  eventBus,
  getPlugin: (name: string) => installedPlugins.find(p => p.name === name)
};

// 在控制台中调试
// window.pluginFramework.getPlugin("myPlugin")
// window.pluginFramework.eventBus.getListenerStats()
```

#### 2. 日志调试

```typescript
// 使用分级日志
debug("详细的调试信息");
info("一般信息");
warn("警告信息");
error("错误信息");

// 创建专用日志器
const logger = createLogger({ prefix: "MyPlugin" });
logger.debug("插件特定的调试信息");
```

### 错误处理

```typescript
export class MyPlugin extends PluginBase {
  async init(): Promise<void> {
    try {
      // 插件初始化逻辑
      await this.initializeFeatures();
    } catch (error) {
      // 记录错误但不阻止框架启动
      error(`${this.name} 初始化失败:`, error);
      this.enable = false; // 禁用插件
    }
  }

  private setupEventListeners(): void {
    on(EventType.CUSTOM, (eventData) => {
      try {
        return this.handleEvent(eventData);
      } catch (err) {
        error(`${this.name} 事件处理错误:`, err);
        // 不返回 true，让其他监听器继续处理
      }
    }, { source: this.name });
  }
}
```

## 🔧 配置说明

### TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Rollup 配置 (rollup.config.js)

- **输出格式**：IIFE（立即执行函数表达式）
- **TypeScript 支持**：完整的类型检查和编译
- **代码压缩**：生产环境自动压缩
- **Source Map**：开发环境生成调试映射

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. **Fork 本仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

### 代码规范

- 使用 TypeScript 进行开发
- 遵循现有的代码风格和命名约定
- 为新功能添加适当的类型定义
- 在插件中添加函数级注释
- 确保代码通过 TypeScript 编译检查

### 提交规范

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. **查看 [Issues](../../issues) 页面**寻找相似问题
2. **创建新的 Issue** 详细描述问题或建议
3. **参与讨论**帮助改进框架

### 常见问题

**Q: 如何调试插件？**
A: 使用浏览器开发者工具，框架会在 `window.pluginFramework` 上暴露调试接口。

**Q: 插件数据丢失怎么办？**
A: 检查 IndexedDB 存储，确保调用了 `saveData()` 方法保存数据。

**Q: 如何优化事件监听器性能？**
A: 合理设置优先级，及时清理不需要的监听器，避免在高频事件中执行重计算。

---

**Happy Coding! 🎉**

*基于事件驱动架构，构建下一代插件化应用*
