// 插件类数组，用于自动实例化
import { SampleKeyboardPlugin } from "@/plugin/SampleKeyboardPlugin";
import { SampleDomPlugin } from "@/plugin/SampleDomPlugin";
import { SampleMousePlugin } from "@/plugin/SampleMousePlugin";
import { SampleNetworkPlugin } from "@/plugin/SampleNetworkPlugin";

// 所有插件类的集合，新增插件只需在这里添加
export const pluginClasses = [
  SampleDomPlugin, // 演示插件 DOM监听
  SampleKeyboardPlugin, // 演示插件 键盘监听
  // SampleMousePlugin, // 演示插件 鼠标监听
  // SampleNetworkExamplePlugin, // 演示插件 网络监听
];
