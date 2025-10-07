// 插件类数组，用于自动实例化
import { KeyboardPlugin } from "@/plugin/KeyboardPlugin";
import { DomPlugin } from "@/plugin/DomPlugin";
import { MousePlugin } from "@/plugin/MousePlugin";
import { NetworkExamplePlugin } from "@/plugin/NetworkExamplePlugin";

// 所有插件类的集合，新增插件只需在这里添加
export const pluginClasses = [DomPlugin, KeyboardPlugin, MousePlugin, NetworkExamplePlugin];
