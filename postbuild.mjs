import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态导入配置文件
async function readConfig() {
  try {
    const configPath = path.resolve(__dirname, "postBuildConfig.mjs");
    const configUrl = `file://${configPath.replace(/\\/g, "/")}`;
    const configModule = await import(configUrl);
    return configModule.default;
  } catch (error) {
    console.error("Error reading postBuildConfig.mjs:", error.message);
    process.exit(1);
  }
}

// 生成油猴脚本头信息
function generateUserScriptHeader(config) {
  const { userscript } = config;

  // 验证必填字段
  const requiredFields = ["name", "namespace", "version", "description"];
  const missingFields = requiredFields.filter((field) => {
    const value = userscript[field];
    if (field === "version") {
      // 版本字段可能是函数或字符串
      if (typeof value === "function") {
        const versionString = value();
        return !versionString || versionString.trim() === "";
      } else {
        return !value || value.trim() === "";
      }
    } else {
      return !value || value.trim() === "";
    }
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required userscript fields: ${missingFields.join(", ")}`);
  }

  let header = "// ==UserScript==\n";

  // 必填字段
  header += `// @name         ${userscript.name}\n`;
  header += `// @namespace    ${userscript.namespace}\n`;
  header += `// @version      ${typeof userscript.version === 'function' ? userscript.version() : userscript.version}\n`;
  header += `// @description  ${userscript.description}\n`;

  // 可选的作者信息
  if (userscript.author && userscript.author.trim()) {
    header += `// @author       ${userscript.author}\n`;
  }

  // 可选的URL信息
  if (userscript.homepage && userscript.homepage.trim()) {
    header += `// @homepage     ${userscript.homepage}\n`;
  }
  if (userscript.supportURL && userscript.supportURL.trim()) {
    header += `// @supportURL   ${userscript.supportURL}\n`;
  }
  if (userscript.updateURL && userscript.updateURL.trim()) {
    header += `// @updateURL    ${userscript.updateURL}\n`;
  }
  if (userscript.downloadURL && userscript.downloadURL.trim()) {
    header += `// @downloadURL  ${userscript.downloadURL}\n`;
  }

  // 处理match数组 - 至少需要一个match或include
  let hasMatchOrInclude = false;
  if (Array.isArray(userscript.match) && userscript.match.length > 0) {
    userscript.match.forEach((match) => {
      if (match && match.trim()) {
        header += `// @match        ${match}\n`;
        hasMatchOrInclude = true;
      }
    });
  } else if (userscript.match && userscript.match.trim()) {
    header += `// @match        ${userscript.match}\n`;
    hasMatchOrInclude = true;
  }

  // 处理include数组
  if (userscript.include) {
    if (Array.isArray(userscript.include)) {
      userscript.include.forEach((include) => {
        if (include && include.trim()) {
          header += `// @include      ${include}\n`;
          hasMatchOrInclude = true;
        }
      });
    } else if (userscript.include.trim()) {
      header += `// @include      ${userscript.include}\n`;
      hasMatchOrInclude = true;
    }
  }

  // 验证至少有一个match或include
  if (!hasMatchOrInclude) {
    console.warn("Warning: No @match or @include patterns specified. The script may not run on any pages.");
  }

  // 处理exclude数组
  if (userscript.exclude) {
    if (Array.isArray(userscript.exclude)) {
      userscript.exclude.forEach((exclude) => {
        if (exclude && exclude.trim()) {
          header += `// @exclude      ${exclude}\n`;
        }
      });
    } else if (userscript.exclude.trim()) {
      header += `// @exclude      ${userscript.exclude}\n`;
    }
  }

  // 图标 - 可选
  if (userscript.icon && userscript.icon.trim()) {
    header += `// @icon         ${userscript.icon}\n`;
  }
  if (userscript.icon64 && userscript.icon64.trim()) {
    header += `// @icon64       ${userscript.icon64}\n`;
  }

  // 处理grant权限 - 如果未指定，默认为none
  if (userscript.grant) {
    if (Array.isArray(userscript.grant)) {
      userscript.grant.forEach((grant) => {
        if (grant && grant.trim()) {
          header += `// @grant        ${grant}\n`;
        }
      });
    } else if (userscript.grant.trim()) {
      header += `// @grant        ${userscript.grant}\n`;
    }
  } else {
    // 如果没有指定grant，默认为none
    header += `// @grant        none\n`;
  }

  // 处理require依赖 - 可选
  if (userscript.require) {
    if (Array.isArray(userscript.require)) {
      userscript.require.forEach((require) => {
        if (require && require.trim()) {
          header += `// @require      ${require}\n`;
        }
      });
    } else if (userscript.require.trim()) {
      header += `// @require      ${userscript.require}\n`;
    }
  }

  // 处理resource资源 - 可选
  if (userscript.resource && typeof userscript.resource === "object") {
    Object.entries(userscript.resource).forEach(([key, value]) => {
      if (key && key.trim() && value && value.trim()) {
        header += `// @resource     ${key} ${value}\n`;
      }
    });
  }

  // 处理connect连接 - 可选
  if (userscript.connect) {
    if (Array.isArray(userscript.connect)) {
      userscript.connect.forEach((connect) => {
        if (connect && connect.trim()) {
          header += `// @connect      ${connect}\n`;
        }
      });
    } else if (userscript.connect.trim()) {
      header += `// @connect      ${userscript.connect}\n`;
    }
  }

  // 运行时机 - 可选，有效值：document-start, document-body, document-end, document-idle, context-menu
  if (userscript["run-at"] && userscript["run-at"].trim()) {
    const validRunAtValues = ["document-start", "document-body", "document-end", "document-idle", "context-menu"];
    if (validRunAtValues.includes(userscript["run-at"])) {
      header += `// @run-at       ${userscript["run-at"]}\n`;
    } else {
      console.warn(`Warning: Invalid @run-at value "${userscript["run-at"]}". Valid values are: ${validRunAtValues.join(", ")}`);
    }
  }

  // 沙箱模式 - 可选，有效值：JavaScript, raw, DOM
  if (userscript.sandbox && userscript.sandbox.trim()) {
    const validSandboxValues = ["JavaScript", "raw", "DOM"];
    if (validSandboxValues.includes(userscript.sandbox)) {
      header += `// @sandbox      ${userscript.sandbox}\n`;
    } else {
      console.warn(`Warning: Invalid @sandbox value "${userscript.sandbox}". Valid values are: ${validSandboxValues.join(", ")}`);
    }
  }

  // iframe支持 - 可选，布尔值
  if (userscript.noframes !== undefined) {
    const boolValue = Boolean(userscript.noframes);
    header += `// @noframes     ${boolValue}\n`;
  }

  // unwrap支持 - 可选，布尔值
  if (userscript.unwrap !== undefined) {
    const boolValue = Boolean(userscript.unwrap);
    header += `// @unwrap       ${boolValue}\n`;
  }

  // 兼容性 - 可选
  if (userscript.nocompat && userscript.nocompat.trim()) {
    header += `// @nocompat     ${userscript.nocompat}\n`;
  }

  // 添加其他可选字段

  // 版权信息 - 可选
  if (userscript.copyright && userscript.copyright.trim()) {
    header += `// @copyright    ${userscript.copyright}\n`;
  }

  // 许可证 - 可选
  if (userscript.license && userscript.license.trim()) {
    header += `// @license      ${userscript.license}\n`;
  }

  // 反特性声明 - 可选
  if (userscript.antifeature) {
    if (Array.isArray(userscript.antifeature)) {
      userscript.antifeature.forEach((antifeature) => {
        if (antifeature && antifeature.trim()) {
          header += `// @antifeature  ${antifeature}\n`;
        }
      });
    } else if (userscript.antifeature.trim()) {
      header += `// @antifeature  ${userscript.antifeature}\n`;
    }
  }

  // 标签 - 可选
  if (userscript.tag) {
    if (Array.isArray(userscript.tag)) {
      userscript.tag.forEach((tag) => {
        if (tag && tag.trim()) {
          header += `// @tag          ${tag}\n`;
        }
      });
    } else if (userscript.tag.trim()) {
      header += `// @tag          ${userscript.tag}\n`;
    }
  }

  header += "// ==/UserScript==\n\n";

  return header;
}

// 为文件添加头信息
function addHeaderToFile(filePath, header) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, "utf-8");

    // 检查文件是否已经包含UserScript头信息
    if (content.includes("// ==UserScript==")) {
      console.log(`File ${filePath} already contains UserScript header, skipping...`);
      return;
    }

    const newContent = header + content;
    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log(`Added userscript header to: ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

// 主函数
async function main() {
  console.log("Starting postbuild process...");

  // 读取配置
  const config = await readConfig();

  // 生成头信息
  const header = generateUserScriptHeader(config);

  // 要处理的文件列表
  const filesToProcess = [path.join(process.cwd(), "dist", "bundle.js"), path.join(process.cwd(), "dist", "bundle.min.js")];

  // 为每个文件添加头信息
  filesToProcess.forEach((filePath) => {
    addHeaderToFile(filePath, header);
  });

  console.log("Postbuild process completed!");
}

// 执行主函数
(async () => {
  await main();
})();
