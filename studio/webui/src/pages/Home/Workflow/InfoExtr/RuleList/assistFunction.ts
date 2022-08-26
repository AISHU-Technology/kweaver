import _ from 'lodash';
import intl from 'react-intl-universal';
import { RuleKey } from '../assistFunction';

/**
 * 规则是否重复
 * @param rules 所有规则
 */
const isRuleRepeat = (rules: any[]) => {
  return _.uniqBy(rules, item => item.entity_type + item.property.property_field).length < rules.length;
};

const ERR_MSG = {
  empty: 'workflow.information.inputEmpty',
  len: 'workflow.information.max64',
  format: 'workflow.information.nameConsists',
  repeat: 'workflow.information.nameRepeat'
};
const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
const VERIFY_FUNCS = [
  (value: string) => (!value.length ? intl.get(ERR_MSG.empty) : ''),
  (value: string) => (value.length > 64 ? intl.get(ERR_MSG.len) : ''),
  (value: string) => (!reg.test(value) ? intl.get(ERR_MSG.format) : ''),
  (value: string, rules?: any[]) => {
    if (!rules) return '';
    return isRuleRepeat(rules) ? intl.get(ERR_MSG.repeat) : '';
  }
];

/**
 * 输入校验
 * @param rules 所有规则
 * @param index 当前检验的规则索引
 * @param value 检验值
 * @param key 校验字段
 * @returns array [errMsg, hasErr]
 */
const verifyFunc = (rules: any[], index: number, value: string, key: string) => {
  let msg = '';
  const rule = rules[index];
  const errMsg = [...rule.errMsg];
  VERIFY_FUNCS.some(func => {
    msg = func(value, rules);
    return msg;
  });

  errMsg[key === RuleKey.NAME ? 0 : 1] = msg;
  return [errMsg, errMsg.some(Boolean)];
};

/**
 * 判断是否有误
 * @param rules 所有规则
 * @param update 更新新增未填写的错误
 * @returns object { isErr, index }
 */
const hasErr = (rules: any[], update = true) => {
  let index = -1;
  const isErr = _.some(rules, (r, i) => {
    let flag = false;

    if (r.errMsg.some(Boolean)) {
      flag = true;
    }

    if (update && (!r.entity_type || !r.property.property_field)) {
      flag = true;
      rules[i].errMsg[!r.entity_type ? 0 : 1] = intl.get(ERR_MSG.empty);
    }

    flag && (index = i);
    return flag;
  });

  return { isErr, index };
};

/**
 * 删除规则
 * @param rules
 * @param index
 */
const deleteRule = (rules: any[], index: number) => {
  const newRules = rules.filter((_, i) => i !== index);
  const { isErr, index: errIndex } = hasErr(rules, false);

  if (!isErr) return newRules;

  if (errIndex === index) {
    newRules.forEach(r => (r.disabled = false));
    return newRules;
  }

  // 因为重复导致的错误，删除后解除错误
  if (rules[errIndex].errMsg.some((msg: string) => msg === intl.get(ERR_MSG.repeat))) {
    newRules.forEach(r => {
      r.disabled = false;
      r.id === rules[errIndex].id && r.errMsg.fill('');
    });
  }

  return newRules;
};

/**
 * 校验最后一个规则是否为空, 会更改原数组
 * @param rules
 */
const verifyLast = (rules: any) => {
  if (!rules.length) return false;

  const lastIndex = rules.length - 1;
  let isErr = false;

  if (!rules[lastIndex].entity_type) {
    isErr = true;
    rules[lastIndex].errMsg[0] = intl.get(ERR_MSG.empty);
  }

  if (!rules[lastIndex].property.property_field) {
    isErr = true;
    rules[lastIndex].errMsg[1] = intl.get(ERR_MSG.empty);
  }

  return isErr;
};

/**
 * 校验所有数据源, 会更改原数组
 * @param sourceList
 * @return errIndex [[sourceIndex, ruleIndex], ...]
 */
const verifySources = (sourceList: any[]) => {
  const errIndex: number[][] = [];
  _.forEach(sourceList, (source, sIndex: number) => {
    const rules = source.extract_rules;

    if (!rules.length) {
      errIndex.push([sIndex, 0]);
      source.isDsError = true;
      source.errorTip = intl.get('workflow.information.placeAdd');
      return;
    }

    source.isDsError = false;
    source.errorTip = '';
    const nameCache: Record<string, boolean> = {};
    let errRuleIndex = -1;

    for (let i = 0; i < rules.length; i++) {
      const name = rules[i].entity_type + rules[i].property.property_field;
      if (name in nameCache) {
        rules[i].errMsg[1] = intl.get(ERR_MSG.repeat);
        errRuleIndex = i;
        break;
      }
      nameCache[name] = true;
      let msg1 = '';
      let msg2 = '';
      VERIFY_FUNCS.some(func => {
        msg1 = func(rules[i].entity_type);
        return msg1;
      });
      VERIFY_FUNCS.some(func => {
        msg2 = func(rules[i].property.property_field);
        return msg2;
      });
      rules[i].errMsg = [msg1, msg2];
      if (msg1 + msg2) {
        errRuleIndex = i;
        break;
      }
    }

    if (errRuleIndex === -1) return;
    _.forEach(rules, (rule, rIndex: number) => errRuleIndex !== rIndex && (rule.disabled = true));
    errIndex.push([sIndex, errRuleIndex]);
  });

  return errIndex;
};

export { isRuleRepeat, verifyFunc, hasErr, deleteRule, verifyLast, verifySources };
