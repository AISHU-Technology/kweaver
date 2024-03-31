/**
 * 图谱图标的中英文显示
 */
import React, { memo } from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { ICON_FIX } from '@/utils/antv6';
import { iconMap } from './iconMap';

// 去除前缀
const cutFix = (type?: string) => _.replace(type || '', ICON_FIX, '');

export const getIconName = (type?: string, language?: string) => {
  if (!type) return '';
  const lang = language || intl.getInitOptions().currentLocale;
  if (lang === 'en-US') return cutFix(type);
  return cutFix(iconMap[type] || type);
};

export interface GraphIconNameProps {
  type?: string;
}

const GraphIconName = (props: GraphIconNameProps) => {
  const { type } = props;
  const name = getIconName(type);
  return <>{name}</>;
};

export default memo(GraphIconName);
