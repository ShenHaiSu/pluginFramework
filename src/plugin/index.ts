// 插件类数组，用于自动实例化
import { NetworkPlugin } from '@/plugin/NetworkPlugin';
import { DomPlugin } from '@/plugin/DomPlugin';
import { KeyboardPlugin } from '@/plugin/KeyboardPlugin';
import { MousePlugin } from '@/plugin/MousePlugin';

// 所有插件类的集合，新增插件只需在这里添加
export const pluginClasses = [
  NetworkPlugin,
  DomPlugin,
  KeyboardPlugin,
  MousePlugin
];
