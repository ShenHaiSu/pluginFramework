/**
 * 油猴脚本配置文件
 *
 * 这个配置文件定义了生成的油猴脚本的所有头信息
 * 支持所有 Tampermonkey 官方文档中的字段
 *
 * 文档参考: https://www.tampermonkey.net/documentation.php
 */

export default {
  userscript: {
    // ========== 基本信息 ==========

    /**
     * 脚本名称 - 显示在 Tampermonkey 管理界面中
     * @type {string}
     */
    name: "Plugin Framework Userscript",

    /**
     * 命名空间 - 用于区分不同作者的同名脚本
     * @type {string}
     */
    namespace: "http://tampermonkey.net/",

    /**
     * 版本号 - 用于脚本更新检测
     * @type {() => string}
     */
    version: () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const h = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      return `${y}.${m}.${d}.${h}${min}`;
    },

    /**
     * 脚本描述 - 简要说明脚本功能
     * @type {string}
     */
    description: "基于TypeScript和Rollup的插件化Web框架",

    /**
     * 作者信息
     * @type {string}
     */
    author: "You",

    // ========== 链接信息 ==========

    /**
     * 项目主页 - 可选，脚本的官方页面
     * @type {string}
     */
    homepage: "",

    /**
     * 支持页面 - 可选，用户反馈问题的地址
     * @type {string}
     */
    supportURL: "",

    /**
     * 更新检测URL - 可选，用于自动更新检测
     * @type {string}
     */
    updateURL: "",

    /**
     * 下载URL - 可选，脚本下载地址
     * @type {string}
     */
    downloadURL: "",

    // ========== 页面匹配规则 ==========

    /**
     * 匹配规则 - 定义脚本在哪些页面运行
     * 支持通配符 * 和 ?
     * @type {string[]}
     */
    match: [
      "http://*/*", // 所有 HTTP 页面
      "https://*/*", // 所有 HTTPS 页面
    ],

    /**
     * 包含规则 - 更灵活的页面匹配（支持正则表达式）
     * @type {string[]}
     */
    include: [
      "*", // 匹配所有页面
    ],

    /**
     * 排除规则 - 不运行脚本的页面
     * @type {string[]}
     */
    exclude: [
      "https://secure.example.com/*", // 排除安全页面
    ],

    // ========== 图标设置 ==========

    /**
     * 脚本图标 - 16x16 像素
     * 可以是 data URL、HTTP URL 或相对路径
     * @type {string}
     */
    icon: "",

    /**
     * 高清图标 - 64x64 像素
     * @type {string}
     */
    icon64: "",

    // ========== 权限设置 ==========

    /**
     * 授权权限 - 脚本可以使用的 GM API
     *
     * 常用权限说明：
     * - GM_setValue/GM_getValue: 数据存储
     * - GM_xmlhttpRequest: 跨域请求
     * - GM_notification: 系统通知
     * - GM_openInTab: 打开新标签页
     * - GM_setClipboard: 操作剪贴板
     * - GM_info: 获取脚本信息
     * - window.close/window.focus: 窗口操作
     * - none: 不使用任何 GM API
     *
     * @type {string[]}
     */
    grant: [],

    // ========== 外部依赖 ==========

    /**
     * 外部库依赖 - 在脚本执行前加载的外部 JavaScript 库
     * @type {string[]}
     */
    require: [],

    /**
     * 外部资源 - 可以通过 GM_getResourceText/GM_getResourceURL 访问
     * @type {Object.<string, string>}
     */
    resource: {},

    // ========== 网络设置 ==========

    /**
     * 允许连接的域名 - 用于 GM_xmlhttpRequest
     * @type {string[]}
     */
    connect: [
      "api.example.com", // API 服务器
      "cdn.example.com", // CDN 服务器
      "*", // 允许所有域名（谨慎使用）
    ],

    // ========== 运行控制 ==========

    /**
     * 运行时机 - 控制脚本何时执行
     *
     * 可选值：
     * - document-start: DOM 开始构建时
     * - document-body: <body> 元素存在时
     * - document-end: DOM 构建完成时（默认）
     * - document-idle: DOM 构建完成且没有脚本在执行时
     * - context-menu: 右键菜单时
     *
     * @type {string}
     */
    "run-at": "document-end",

    /**
     * 沙箱模式 - 脚本运行环境
     *
     * 可选值：
     * - JavaScript: 在页面的 JavaScript 环境中运行
     * - raw: 在独立的环境中运行
     *
     * @type {string}
     */
    sandbox: "JavaScript",

    // ========== 高级设置 ==========

    /**
     * iframe 支持 - 是否在 iframe 中运行脚本
     *
     * - false: 在 iframe 中也运行
     * - true: 不在 iframe 中运行（默认）
     *
     * @type {boolean}
     */
    noframes: true,

    /**
     * 解包装 - 是否解除函数包装
     *
     * - false: 不解包装（默认，推荐）
     * - true: 解包装（可能有安全风险）
     *
     * @type {boolean}
     */
    unwrap: false,

    /**
     * 兼容性设置 - 指定不兼容的浏览器
     *
     * 可选值：Chrome, Firefox, Safari, Edge 等
     * @type {string}
     */
    nocompat: "Chrome",
  },
};
