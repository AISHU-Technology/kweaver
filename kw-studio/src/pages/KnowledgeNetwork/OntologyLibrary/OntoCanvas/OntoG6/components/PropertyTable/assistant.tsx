import intl from 'react-intl-universal';
import _ from 'lodash';
import { GRAPH_MODEL_ALIAS } from '@/enums';
import { AttributeItem } from '../../types/items';

// 定义校验器
const verifyFunc: Record<string, Function> = {
  required: (value: string, isReq: boolean, message: string) => (isReq && !value ? message : ''),
  max: (value: string, length: number, message: string) => (value?.length > length ? message : ''),
  pattern: (value: string, reg: RegExp, message: string) => (!reg.test(value) ? message : ''),
  validator: (value: any, func: Function) => {
    try {
      func(value);
    } catch (err) {
      return err.message || '';
    }
  }
};

/**
 * 触发校验
 * @param value 校验值
 * @param rules 校验规则
 * @returns errMsg 错误信息
 */
const verifying = (value: string, rules: any[]) => {
  let errMsg = '';
  _.some(rules, rule => {
    const [[rKey, rValue], [, msg]] = [...Object.entries(rule), []];
    const message = verifyFunc[rKey!](value, rValue, msg);
    message && (errMsg = message);
    return !!message;
  });
  return errMsg;
};

/**
 * 校验属性名
 * @param value 校验值
 * @param property 所有属性, 传入则校验重复
 */
export const verifyProName = (value: string, property?: AttributeItem[]) => {
  const proNameRules = [
    { required: true, message: intl.get('global.noNull') },
    { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
    { pattern: /^\w+$/, message: intl.get('ontoLib.errInfo.eLettersNumber_') },
    property && {
      validator: (value: string) => {
        if (_.some(property, p => p.attrName === value)) {
          throw new Error(intl.get('global.repeatName'));
        }
      }
    }
  ].filter(Boolean);
  const errMsg = verifying(value, proNameRules);
  return errMsg;
};

/**
 * 校验属性显示名
 * @param value 校验值
 * @param property 所有属性, 传入则校验重复
 */
export const verifyProAlias = (value: string, property?: AttributeItem[]) => {
  const proAliasRules = [
    { required: true, message: intl.get('global.noNull') },
    { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
    { pattern: /^[\u4e00-\u9fa5\w]+$/, message: intl.get('global.onlyNormalName') },
    property && {
      validator: (value: string) => {
        if (_.some(property, p => p.attrDisplayName === value)) {
          throw new Error(intl.get('global.repeatName'));
        }
      }
    }
  ].filter(Boolean);
  const errMsg = verifying(value, proAliasRules);
  return errMsg;
};

/**
 * 校验所有属性
 * @param property
 */
export const verifyProperty = (property: AttributeItem[], type: string) => {
  const errorFields: any[] = [];
  const nameMap: any = {};
  const aliasMap: any = {};
  const checkedCount = { attrIndex: 0, attrMerge: 0 };

  // 校验格式
  const newProperty = _.map(property, (item, i) => {
    item.attrIndex && (checkedCount.attrIndex += 1);
    item.attrMerge && (checkedCount.attrMerge += 1);

    const error: any = {};
    const nameErr = verifyProName(item.attrName);
    if (nameErr) {
      error.attrName = nameErr;
    } else {
      nameMap[item.attrName] && (error.attrName = intl.get('createEntity.proRepeat'));
    }

    const aliasErr = verifyProAlias(item.attrDisplayName);
    if (aliasErr) {
      error.attrDisplayName = aliasErr;
    } else {
      aliasMap[item.attrDisplayName] && (error.attrDisplayName = intl.get('createEntity.proAliasRepeat'));
    }

    nameMap[item.attrName] = true;
    aliasMap[item.attrDisplayName] = true;
    error.attrName && errorFields.push({ name: ['attrName' + i], errors: [error.attrName] });
    error.attrDisplayName && errorFields.push({ name: ['attrDisplayName' + i], errors: [error.attrDisplayName] });
    return { ...item, error };
  });

  // 索引、融合开关校验
  let checkedError: any = {};
  if (type === 'node' && property.length) {
    checkedError = {
      attrIndex: checkedCount.attrIndex ? '' : intl.get('createEntity.limitIndex'),
      attrMerge: checkedCount.attrMerge ? '' : intl.get('ontoLib.errInfo.oneMerge')
    };

    checkedError.attrIndex && errorFields.push({ name: ['attrIndex'], errors: [checkedError.attrIndex] });
    checkedError.attrMerge && errorFields.push({ name: ['attrMerge'], errors: [checkedError.attrMerge] });
  }

  return { property: newProperty, checkedError, errorFields };
};
