import React from 'react';
import { createFromIconfontCN } from '@ant-design/icons';
import { IconFontProps } from '@ant-design/icons/lib/components/IconFont';
import iconJS from '@/assets/graphIcons/iconfont.js';
import fonts from '@/assets/graphIcons/iconfont.json';

// 添加名称显示组件的入口
export { default as GraphIconName, getIconName } from '@/components/GraphIconName';

// 前缀
export const ICON_FIX = fonts.css_prefix_text;

// 模型icon
export const MODEL_ICON = `${ICON_FIX}model`;

// 所有icon
export const TOTAL_ICONS = fonts.glyphs.reduce((res, icon) => {
  const font_class = `${ICON_FIX}${icon.font_class}`;
  res[font_class] = {
    name: icon.name,
    font_class,
    unicode: String.fromCodePoint(icon.unicode_decimal) // `\\u${icon.unicode}`,
  };
  return res;
}, {} as Record<string, { name: string; font_class: string; unicode: string }>);

/**
 * 根据font class获取图标unicode, 包含\u
 */
export const getIconCode = (type?: string) => {
  if (!type) return '';
  const matchIcon = TOTAL_ICONS[type];
  return matchIcon?.unicode || '';
};

/**
 * 图谱icon
 */
const IconComponent = createFromIconfontCN({ scriptUrl: iconJS });
export const GraphIcon = (props: IconFontProps) => {
  const { type } = props;
  if (!type) return null;
  if (!TOTAL_ICONS[type]) return null;
  return <IconComponent {...props} />;
};
