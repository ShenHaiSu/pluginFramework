// 插件类数组，用于自动实例化
import { KeyboardPlugin } from "@/plugin/KeyboardPlugin";
import { DomPlugin } from "@/plugin/DomPlugin";
import { MousePlugin } from "@/plugin/MousePlugin";
import { NetworkExamplePlugin } from "@/plugin/NetworkExamplePlugin";

// 所有插件类的集合，新增插件只需在这里添加
export const pluginClasses = [
  // DomPlugin, // 演示插件 DOM监听
  KeyboardPlugin, // 演示插件 键盘监听
  // MousePlugin, // 演示插件 鼠标监听
  // NetworkExamplePlugin, // 演示插件 网络监听
];
