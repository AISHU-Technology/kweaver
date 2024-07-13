import _ from 'lodash';

enum RuleName {
  required,
  max,
  min,
  pattern,
  validator
}
type RuleKeys = keyof typeof RuleName;
type TRules = (Partial<Record<RuleKeys, any>> & { message?: string; validator?: any })[];

export class FormValidator {
  private rules: TRules = [];

  constructor(initRules?: TRules) {
    initRules && (this.rules = initRules);
  }

  private _verifyFunc: Record<RuleKeys, Function> = {
    required: (value: any, isReq: boolean, message: string) => (isReq && !value ? message : ''),
    max: (value: any, length: number, message: string) => (value?.length > length ? message : ''),
    min: (value: any, length: number, message: string) => (value?.length < length ? message : ''),
    pattern: (value: any, reg: RegExp, message: string) => (!reg.test(value) ? message : ''),
    validator: (value: any, func: Function) => {
      try {
        func(value);
      } catch (err) {
        return err.message || '';
      }
    }
  };

  /**
   * 获取校验规则
   * @param rule
   */
  private _getRule(rule: TRules[number]) {
    const keys = _.keys(this._verifyFunc) as RuleKeys[];
    let ruleTuple: any = [];
    _.some(keys, k => {
      if (k in rule) {
        ruleTuple = [k, rule[k]];
      }
    });
    return ruleTuple;
  }

  /**
   * 触发校验
   * @param value 校验值
   * @param options 校验规则配置项
   * @returns errMsg 错误信息
   */
  verify(value: any, options?: { rules?: TRules }) {
    const rules = options?.rules || this.rules;
    let errMsg = '';
    _.some(rules, rule => {
      const [rKey, rValue] = this._getRule(rule);
      if (!rKey) return false;
      const msg = rule.message;
      const message = this._verifyFunc[rKey as RuleKeys](value, rValue, msg);
      message && (errMsg = message);
      return !!message;
    });
    return errMsg;
  }
}
