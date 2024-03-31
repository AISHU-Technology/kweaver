import intl from 'react-intl-universal';
import _ from 'lodash';
import { GRAPH_MODEL_ALIAS } from '@/enums';

/**
 * 转换属性结构, [[name, type, alias], ...] ----> [{ name, type, alias }, ...]
 * @param property 二维数组格式的属性
 * @param indexes 属性索引
 * @param isModel 是否是模型
 */
export const transProperty = (property: any[], indexes: string[], isModel?: boolean) => {
  return _.map(property, item => {
    if (_.isArray(item)) {
      const [name, type, alias] = item;
      const curAlias = alias || (isModel ? GRAPH_MODEL_ALIAS[name] || name : name);
      return { name, type, alias: curAlias, checked: _.includes(indexes, name) };
    }
    return item;
  });
};

/**
 * 把属性还原成后端需要的格式
 * @param property 对象数组格式的属性
 */
export const revertProperty = (property: any[]) => {
  const indexes: string[] = [];
  const proArr = _.map(property, item => {
    const { name, type, alias, checked } = item;
    checked && indexes.push(name);
    return [name, type, alias];
  });
  return [proArr, indexes];
};

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
export const verifyProName = (value: string, property?: any[]) => {
  const proNameRules = [
    { required: true, message: intl.get('global.noNull') },
    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
    { pattern: /^\w+$/, message: intl.get('global.onlyMetacharacters') },
    property && {
      validator: (value: string) => {
        if (_.some(property, p => p.name === value)) {
          throw new Error(intl.get('createEntity.proRepeat'));
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
export const verifyProAlias = (value: string, property?: any[]) => {
  const proAliasRules = [
    { required: true, message: intl.get('global.noNull') },
    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
    { pattern: /^[\u4e00-\u9fa5\w]+$/, message: intl.get('global.onlyNormalName') },
    property && {
      validator: (value: string) => {
        if (_.some(property, p => p.alias === value)) {
          throw new Error(intl.get('createEntity.proAliasRepeat'));
        }
      }
    }
  ].filter(Boolean);
  const errMsg = verifying(value, proAliasRules);
  return errMsg;
};

/**
 * 校验所有属性, 遇到错误便中断
 * @param property
 */
export const verifyProperty = (property: string[][] | Record<string, any>[]) => {
  let errIndex = -1;
  const errMsg: Record<string, any> = {};

  // 校验格式
  _.some(property, (item, i) => {
    let name = '';
    let alias = '';
    if (_.isArray(item)) {
      [name, , alias] = item;
    } else {
      name = item?.name;
      alias = item?.alias;
    }
    const nameErr = verifyProName(name);
    if (nameErr) {
      errIndex = i;
      errMsg.name = nameErr;
    }
    const aliasErr = verifyProAlias(alias);
    if (aliasErr) {
      errIndex = i;
      errMsg.alias = aliasErr;
    }
    return errIndex > -1;
  });

  // 没有格式错误, 校验重名
  if (errIndex < 0) {
    const nameList = _.map(property, pro => (_.isArray(pro) ? pro[0] : pro?.name));
    const nameRepeatIndex = getRepeatIndex(nameList);
    if (nameRepeatIndex > -1) {
      errIndex = nameRepeatIndex;
      errMsg.name = intl.get('createEntity.proRepeat');
    }

    const aliasList = _.map(property, pro => (_.isArray(pro) ? pro[3] || pro[0] : pro?.alias));
    const aliasRepeatIndex = getRepeatIndex(aliasList);
    if (aliasRepeatIndex < 0) {
      return { errIndex, errMsg };
    }
    if (aliasRepeatIndex < nameRepeatIndex) {
      errIndex = nameRepeatIndex;
      errMsg.name = '';
      errMsg.alias = intl.get('createEntity.proAliasRepeat');
      return { errIndex, errMsg };
    }
    if (aliasRepeatIndex === nameRepeatIndex) {
      errMsg.alias = intl.get('createEntity.proAliasRepeat');
    }
  }
  return { errIndex, errMsg };
};

/**
 * 获取重复的元素的数组下标
 * @param list
 */
const getRepeatIndex = (list: any[]) => {
  let i = -1;
  list.some((item, index, self) => {
    if (self.indexOf(item) !== index) {
      i = index;
      return true;
    }
    return false;
  });
  return i;
};
