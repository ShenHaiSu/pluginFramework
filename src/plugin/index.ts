// 插件类数组，用于自动实例化
import { NetworkPlugin } from './NetworkPlugin';
import { DomPlugin } from './DomPlugin';
import { KeyboardPlugin } from './KeyboardPlugin';
import { MousePlugin } from './MousePlugin';

// 所有插件类的集合，新增插件只需在这里添加
export const pluginClasses = [
  NetworkPlugin,
  DomPlugin,
  KeyboardPlugin,
  MousePlugin
];
