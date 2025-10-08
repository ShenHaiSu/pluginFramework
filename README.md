# 油猴插件开发框架 (Tampermonkey Plugin Framework)

一个专为油猴(Tampermonkey)插件开发设计的可扩展框架，基于 TypeScript 和事件驱动架构，旨在简化事件监听和插件交互的开发流程。

## 📋 项目概述

本项目是一个**油猴(Tampermonkey)插件开发框架**，为开发者提供了一个**可横向扩展的插件开发平台**。框架专注于**简化事件监听和插件交互的开发流程**，让开发者能够快速构建功能丰富的用户脚本。

### 核心价值

- **🔧 开发效率提升**：提供标准化的插件开发模板和工具链
- **🎯 事件驱动架构**：基于高性能事件总线，支持复杂的事件处理逻辑
- **🔌 模块化设计**：插件间松耦合，支持独立开发和部署
- **📦 一键构建**：自动生成符合 Tampermonkey 规范的用户脚本
- **💾 数据持久化**：内置 IndexedDB 支持，数据安全可靠

## ✨ 核心功能

### 🚌 内置事件总线系统

框架提供了完整的事件总线系统，包含以下四大核心检测功能：

#### 1. DOM 变动检测

- **基于 MutationObserver**：高性能的 DOM 变化监听
- **精确变更追踪**：支持节点增删、属性修改、文本变化等
- **选择器过滤**：可指定监听特定元素的变化
- **批量处理**：优化性能，避免频繁触发

#### 2. 按键事件检测

- **全局键盘监听**：捕获所有键盘事件
- **快捷键绑定**：支持组合键和自定义快捷键
- **按键状态管理**：实时跟踪修饰键状态
- **事件优先级**：支持事件拦截和短路机制

#### 3. 鼠标事件检测

- **完整鼠标事件**：点击、移动、滚轮等全覆盖
- **精确坐标追踪**：提供详细的位置信息
- **按钮状态检测**：区分左键、右键、中键操作
- **拖拽支持**：内置拖拽事件处理

#### 4. 网络请求检测

- **请求拦截**：支持 fetch 和 XMLHttpRequest 拦截
- **响应解析**：自动解析 JSON 响应内容
- **性能统计**：记录请求时间和状态信息
- **错误处理**：完善的网络错误捕获机制

### 🎛️ 便捷的事件订阅

开发者可以通过简单的 API 便捷订阅所需的事件类型：

```typescript
// 订阅DOM变化事件
on(EventType.DOM_MUTATION, (eventData) => {
  console.log("DOM发生变化:", eventData);
});

// 订阅键盘事件
on(EventType.KEYDOWN, (eventData) => {
  console.log("按键按下:", eventData);
});

// 订阅网络请求事件
on(EventType.NETWORK_RESPONSE, (eventData) => {
  console.log("网络响应:", eventData);
});
```

## 🎯 示例参考

### 演示插件目录

plugin 目录包含**四个演示插件**，分别展示不同事件总线的调用方式，可作为开发参考模板：

#### 1. SampleDomPlugin - DOM 监听插件

- **功能特性**：监听 DOM 变化并提供 DOM 操作工具
- **应用场景**：页面元素监控、动态内容检测、UI 自动化
- **核心功能**：
  - DOM 变更统计和记录
  - 元素追踪和管理
  - 变化类型分析

#### 2. SampleKeyboardPlugin - 键盘事件插件

- **功能特性**：监听键盘事件并管理快捷键
- **应用场景**：快捷键绑定、输入监控、游戏辅助
- **核心功能**：
  - 按键统计和历史记录
  - 快捷键组合检测
  - 修饰键状态管理

#### 3. SampleMousePlugin - 鼠标事件插件

- **功能特性**：监听鼠标左键按下事件
- **应用场景**：点击统计、用户行为分析、交互优化
- **核心功能**：
  - 鼠标点击计数
  - 点击位置记录
  - 点击时间统计

#### 4. SampleNetworkPlugin - 网络监听插件

- **功能特性**：网络响应体监听器，演示如何获取网络响应的 JSON 内容
- **应用场景**：API 调试、数据抓取、网络监控
- **核心功能**：
  - 网络请求拦截和分析
  - JSON 响应自动解析
  - 用户数据提取和缓存
  - 网络性能统计

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

## 🏗️ 项目架构

### 目录结构

```
pluginFramework/
├── src/                           # 源代码目录
│   ├── index.ts                   # 框架入口文件
│   ├── pluginEntry.ts            # 插件入口管理
│   │
│   ├── plugin/                    # 插件实现目录
│   │   ├── SampleDomPlugin.ts     # DOM变化监听插件
│   │   ├── SampleKeyboardPlugin.ts # 键盘事件处理插件
│   │   ├── SampleMousePlugin.ts   # 鼠标事件处理插件
│   │   └── SampleNetworkPlugin.ts # 网络监听示例插件
│   │
│   ├── composable/               # 插件类型定义目录
│   │   ├── SampleDomPlugin/      # DOM插件类型定义
│   │   ├── SampleKeyboardPlugin/ # 键盘插件类型定义
│   │   ├── SampleMousePlugin/    # 鼠标插件类型定义
│   │   └── SampleNetworkPlugin/  # 网络插件类型定义
│   │
│   └── util/                     # 核心工具类目录
│       ├── EventBus.ts          # 事件总线核心实现
│       ├── EventEmitter.ts      # 事件发射器
│       ├── EventTypes.ts        # 事件类型定义
│       ├── EventDomObserver.ts  # DOM变化观察者
│       ├── EventKeyboardListener.ts # 键盘事件监听器
│       ├── EventMouseListener.ts # 鼠标事件监听器
│       ├── EventNetworkListener.ts # 网络请求监听器
│       ├── PluginBase.ts        # 插件基类定义
│       ├── installedPlugins.ts  # 插件实例管理
│       ├── db.ts                # IndexedDB数据库操作
│       └── logger.ts            # 日志系统
│
├── dist/                         # 构建输出目录
├── package.json                  # 项目配置文件
├── tsconfig.json                # TypeScript配置
├── rollup.config.js             # Rollup构建配置
├── postBuildConfig.mjs          # 油猴脚本配置
└── postbuild.mjs               # 构建后处理脚本
```

### 核心组件关系

```
┌─────────────────────────────────────────────────────────────┐
│                 Tampermonkey Plugin Framework               │
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
│  │  数据持久化 │    │   日志系统   │    │   构建系统      │ │
│  │             │    │              │    │                 │ │
│  │ IndexedDB   │    │   Logger     │    │   Rollup        │ │
│  │   存储      │    │              │    │   + PostBuild   │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📚 开发指南

### API 文档说明

**详细的 API 文档请参考项目中的注释说明**。每个核心模块都包含完整的 TypeScript 类型定义和 JSDoc 注释：

- **事件总线 API**：<mcfile name="EventBus.ts" path="F:\MyProgram\pluginFramework\src\util\EventBus.ts"></mcfile>
- **插件基类 API**：<mcfile name="PluginBase.ts" path="F:\MyProgram\pluginFramework\src\util\PluginBase.ts"></mcfile>
- **事件类型定义**：<mcfile name="EventTypes.ts" path="F:\MyProgram\pluginFramework\src\util\EventTypes.ts"></mcfile>
- **数据库操作 API**：<mcfile name="db.ts" path="F:\MyProgram\pluginFramework\src\util\db.ts"></mcfile>

### 开发规范

**请遵循现有代码风格**进行开发：

- 使用 **TypeScript** 进行开发，确保类型安全
- 遵循 **驼峰命名法** 和现有的命名约定
- 为新功能添加适当的 **类型定义** 和 **JSDoc 注释**
- 使用框架提供的 **日志系统** 进行调试和错误记录
- 插件开发请继承 **PluginBase** 基类
- 事件监听请使用 **EventBus** 提供的 API

### 创建自定义插件

1. **创建插件文件**：在 `src/plugin/` 目录下创建新的插件文件
2. **继承基类**：继承 `PluginBase` 并实现必要的方法
3. **定义类型**：在 `src/composable/` 目录下创建对应的类型定义
4. **注册插件**：在插件入口文件中注册新插件

### 油猴脚本配置

油猴脚本的配置信息在 <mcfile name="postBuildConfig.mjs" path="F:\MyProgram\pluginFramework\postBuildConfig.mjs"></mcfile> 文件中定义，包括：

- 脚本名称、版本、描述
- 页面匹配规则
- 权限设置
- 外部依赖配置

## 🤝 贡献指南

我们欢迎所有形式的贡献！**贡献指南详见 CONTRIBUTING.md**（注：该文件需要创建）。

### 参与方式

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

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. **查看 Issues 页面**寻找相似问题
2. **创建新的 Issue** 详细描述问题或建议
3. **参与讨论**帮助改进框架

### 常见问题

**Q: 如何调试插件？**
A: 使用浏览器开发者工具，框架会在控制台输出详细的调试信息。

**Q: 插件数据丢失怎么办？**
A: 检查 IndexedDB 存储，确保调用了 `saveData()` 方法保存数据。

**Q: 如何优化事件监听器性能？**
A: 合理设置优先级，及时清理不需要的监听器，避免在高频事件中执行重计算。

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**Happy Coding! 🎉**

_基于事件驱动架构，构建下一代油猴插件应用_
