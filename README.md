# Plugin Framework

基于 TypeScript 和 Rollup 的插件化 Web 框架，支持模块化插件开发和管理。

## 📋 项目简介

Plugin Framework 是一个轻量级、可扩展的插件化框架，旨在为 Web 应用提供强大的插件系统。框架采用 TypeScript 开发，使用 Rollup 进行构建，支持生成油猴脚本（Userscript）。

## ✨ 主要特性

- 🔌 **插件化架构**：模块化设计，支持插件的动态加载和管理
- 📦 **TypeScript 支持**：完整的类型定义，提供更好的开发体验
- 🛠️ **内置插件**：提供多种实用插件，开箱即用
- 💾 **数据持久化**：基于 IndexedDB 的数据存储系统
- 📝 **日志系统**：完善的日志记录和调试功能
- 🎯 **油猴脚本**：支持生成 Tampermonkey 兼容的用户脚本
- ⚡ **高性能构建**：使用 Rollup 优化打包体积和性能

## 🏗️ 项目结构

```
pluginFramework/
├── src/                    # 源代码目录
│   ├── index.ts           # 框架入口文件
│   ├── plugin/            # 插件目录
│   │   ├── DomPlugin.ts   # DOM 监听插件
│   │   ├── KeyboardPlugin.ts  # 键盘事件插件
│   │   ├── MousePlugin.ts     # 鼠标事件插件
│   │   ├── NetworkPlugin.ts   # 网络请求插件
│   │   └── index.ts       # 插件导出文件
│   └── util/              # 工具类目录
│       ├── PluginBase.ts  # 插件基类
│       ├── db.ts          # 数据库操作
│       ├── logger.ts      # 日志系统
│       └── installedPlugins.ts  # 插件管理
├── dist/                  # 构建输出目录
├── postBuildConfig.mjs    # 构建后处理配置
├── postbuild.mjs          # 构建后处理脚本
├── rollup.config.js       # Rollup 配置文件
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目配置文件
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 开发模式

```bash
# 监听文件变化，自动重新构建
npm run watch
```

### 构建项目

```bash
# 构建生产版本
npm run build

# 构建后自动添加油猴脚本头信息
npm run postbuild
```

## 🔌 内置插件

### 1. NetworkPlugin - 网络请求插件
- 拦截和监听 fetch 请求
- 记录请求和响应数据
- 提供网络统计信息

### 2. DomPlugin - DOM 监听插件
- 监听 DOM 变化（MutationObserver）
- 跟踪特定元素
- 记录 DOM 操作历史

### 3. KeyboardPlugin - 键盘事件插件
- 监听键盘按键事件
- 支持快捷键绑定
- 记录按键统计信息

### 4. MousePlugin - 鼠标事件插件
- 监听鼠标移动、点击事件
- 跟踪鼠标位置
- 记录点击统计信息

## 🛠️ 插件开发

### 创建自定义插件

1. 继承 `PluginBase` 基类：

```typescript
import { PluginBase } from "../util/PluginBase";
import { info } from "../util/logger";

export class MyPlugin extends PluginBase {
  constructor() {
    super("myPlugin", "我的自定义插件", true, true, ["custom"]);
  }

  async init(): Promise<void> {
    info(`初始化 ${this.name} 插件`);
    
    // 从数据库加载数据
    const db = await import("../util/db");
    const savedData = await db.getPluginData(this.name);
    if (savedData) {
      this.databaseData = savedData;
    }

    // 初始化插件逻辑
    this.setupPlugin();
  }

  private setupPlugin(): void {
    // 插件具体实现
  }
}
```

2. 在 `src/plugin/index.ts` 中注册插件：

```typescript
import { MyPlugin } from './MyPlugin';

export const pluginClasses = [
  // ... 其他插件
  MyPlugin
];
```

### 插件基类 API

- `name`: 插件名称
- `describe`: 插件描述
- `enable`: 是否启用
- `canDisable`: 是否可禁用
- `tags`: 插件标签
- `internalData`: 内存数据（不持久化）
- `databaseData`: 持久化数据
- `saveData()`: 保存数据到 IndexedDB
- `getPlugin<T>(name)`: 获取其他插件实例

## 📊 数据存储

框架使用 IndexedDB 进行数据持久化：

```typescript
// 保存插件数据
await this.saveData();

// 获取插件数据
const db = await import("../util/db");
const data = await db.getPluginData("pluginName");

// 获取所有插件数据
const allData = await db.getAllPluginData();
```

## 📝 日志系统

框架提供完善的日志系统：

```typescript
import { debug, info, warn, error, fatal } from "../util/logger";

debug("调试信息");
info("普通信息");
warn("警告信息");
error("错误信息");
fatal("致命错误");

// 创建子 Logger
import { createLogger } from "../util/logger";
const moduleLogger = createLogger({ prefix: "MyModule" });
```

## 🎯 油猴脚本配置

在 `postBuildConfig.mjs` 中配置油猴脚本信息：

```javascript
export default {
  userscript: {
    name: "Plugin Framework Userscript",
    namespace: "http://tampermonkey.net/",
    version: () => "1.0.0",
    description: "基于TypeScript和Rollup的插件化Web框架",
    author: "Your Name",
    match: ["http://*/*", "https://*/*"],
    grant: ["none"]
  }
};
```

## 🔧 配置说明

### TypeScript 配置 (tsconfig.json)
- 目标版本：ES2017
- 模块系统：ESNext
- 严格模式：启用

### Rollup 配置 (rollup.config.js)
- 输出格式：IIFE
- 支持 TypeScript
- 代码压缩和 Source Map

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue 描述问题
3. 参与讨论和改进

---

**Happy Coding! 🎉**