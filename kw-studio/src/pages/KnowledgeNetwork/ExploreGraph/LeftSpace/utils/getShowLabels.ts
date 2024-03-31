import _ from 'lodash';
import { ANALYSIS_PROPERTIES } from '@/enums';

/**
 * @param attribute 点边的 id class alias 属性
 * @param properties 本体配置属性
 * @param isEdge 是否为边类
 * @returns 画布所需的显示列表
 */
export const getShowLabels = (attribute: any, properties: any, isEdge?: boolean) => {
  if (_.isEmpty(properties) && _.isEmpty(attribute)) return;
  const { defaultAtr, entityAttr, edgeAttr } = ANALYSIS_PROPERTIES;
  const attrKeys = isEdge ? edgeAttr : entityAttr;

  const showLabels = _.map(attrKeys, (key: string) => {
    const isChecked = isEdge && key === '#alias';
    return { key, alias: key, value: attribute[key], isChecked, isDisabled: false, type: 'string' };
  });

  // 数组的处理
  if (_.isArray(properties)) {
    _.forEach(properties || [], item => {
      showLabels.push({
        key: item.key || item.name || item?.n,
        alias: item.alias || item.name || item?.n,
        value: item.value || item?.v,
        type: item.type,
        isChecked: item.checked || false,
        isDisabled: item.disabled || false
      });
    });

    return _.filter(showLabels, label => !_.includes(defaultAtr, label?.key));
  }

  // 对象的处理
  if (_.isObject(properties)) {
    const obj: Record<string, any> = { ...properties };
    _.forEach(_.keys(obj), key => {
      const value = obj?.[key];
      showLabels.push({
        key,
        alias: key,
        value,
        isChecked: false,
        isDisabled: false,
        type: 'string'
      });
    });
    return _.filter(showLabels, label => !_.includes(defaultAtr, label?.key));
  }

  return showLabels;
};
