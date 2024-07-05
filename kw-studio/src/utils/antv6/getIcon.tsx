import React from 'react';
import { createFromIconfontCN } from '@ant-design/icons';
import { IconFontProps } from '@ant-design/icons/lib/components/IconFont';
import iconJS from '@/assets/graphIcons/iconfont.js';
import fonts from '@/assets/graphIcons/iconfont.json';

export { default as GraphIconName, getIconName } from './GraphIconName';

export const ICON_FIX = fonts.css_prefix_text;

export const MODEL_ICON = `${ICON_FIX}model`;

export const TOTAL_ICONS = fonts.glyphs.reduce((res, icon) => {
  const font_class = `${ICON_FIX}${icon.font_class}`;
  res[font_class] = {
    name: icon.name,
    font_class,
    unicode: String.fromCodePoint(icon.unicode_decimal)
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
