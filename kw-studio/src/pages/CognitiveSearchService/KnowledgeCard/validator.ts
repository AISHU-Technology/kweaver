import intl from 'react-intl-universal';
import _ from 'lodash';
import { FormValidator } from '@/utils/handleFunction';
import KNOWLEDGE_CARD from './enums';
import { TitleObj } from './types';

// 校验器
export const validator = new FormValidator();

// 定义校验规则, 有些字段默认填充且不会被清除, 无需校验
const getRules = (type: string) => {
  return {
    // 实体信息
    [KNOWLEDGE_CARD.ENTITY_INFO]: {
      title: [{ required: true, message: intl.get('global.pleaseSelect') }],
      description: [{ required: true, message: intl.get('global.pleaseSelect') }],
      properties: [
        {
          validator: (properties: any[]) => {
            if (!properties.length || _.some(properties, pro => !pro.name)) {
              throw new Error(intl.get('global.pleaseSelect'));
            }
          }
        }
      ]
    },
    // 相关词条
    [KNOWLEDGE_CARD.RELATED_LABEL]: {
      title: [{ validator: verifyTitle }],
      entities: [
        {
          validator: (entities: string[]) => {
            if (!entities.length || _.some(entities, name => !name)) {
              throw new Error(intl.get('global.pleaseSelect'));
            }
          }
        }
      ]
    },
    // 相关文档1(icon类型)
    [KNOWLEDGE_CARD.RELATED_DOCUMENT_1]: {
      title: [{ validator: verifyTitle }],
      entity: [{ required: true, message: intl.get('global.pleaseSelect') }],
      endNodeProperty1: [{ required: true, message: intl.get('global.pleaseSelect') }]
    },
    // 相关文档2(缩略图类型)
    [KNOWLEDGE_CARD.RELATED_DOCUMENT_2]: {
      title: [{ validator: verifyTitle }],
      entity: [{ required: true, message: intl.get('global.pleaseSelect') }],
      endNodeProperty1: [{ required: true, message: intl.get('global.pleaseSelect') }],
      endNodeProperty2: [{ required: true, message: intl.get('global.pleaseSelect') }],
      imageUrl: [{ required: true, message: intl.get('global.pleaseSelect') }]
    }
  }[type];
};

/**
 * 校验标题
 * @param titleObj
 */
export const verifyTitle = (titleObj: TitleObj) => {
  const rules = [
    { required: false, message: '' },
    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
    {
      // 繁体：\u3400-\u4db5, 简体：\u4e00-\u9fa5; 取并集
      pattern: /^[\s\n\u3400-\u9fa5a-zA-Z0-9!-~？！，、；。……：“”‘’（）｛｝《》【】～￥—·]+$/,
      message: intl.get('global.onlyKeyboard')
    }
  ];
  const error: Record<string, string> = {};
  let hasValue = false;
  _.entries(titleObj).forEach(([k, v]) => {
    if (!v) return;
    hasValue = true;
    const errMsg = validator.verify(v, { rules });
    errMsg && (error[k] = errMsg);
  });
  if (!hasValue) {
    error.error = intl.get('knowledgeCard.titleLeast');
  }
  if (!_.isEmpty(error)) {
    throw new Error(JSON.stringify({ json: error }));
  }
};

/**
 * 校验
 * @param data
 */
export const triggerVerify = (data: any) => {
  const rulesObj = getRules(data.type);
  const error: Record<string, string> = {};
  _.entries(rulesObj).forEach(([field, rules]) => {
    if (_.has(data, field)) {
      const errMsg = validator.verify(data[field], { rules });
      if (!errMsg) return;
      error[field] = _.startsWith(errMsg, '{"json":') ? JSON.parse(errMsg).json : errMsg;
    }
  });
  return error;
};

/**
 * 校验所有组件
 * @param components
 */
export const verifyComponents = (components: any[]) => {
  let firstErrorIndex = -1;
  const verifiedData = _.map(components, (item, index) => {
    const component = { ...item };
    component.error = triggerVerify(component);
    if (firstErrorIndex === -1 && !_.isEmpty(component.error)) {
      firstErrorIndex = index;
    }
    return component;
  });
  return { components: verifiedData, firstErrorIndex };
};
