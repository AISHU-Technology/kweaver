import { useState } from 'react';

const isFunction = (func: any) => typeof func === 'function';
const isObject = (obj: any) => Object.prototype.toString.call(obj) === '[object Object]';
const isArray = (arr: any) => Array.isArray(arr);

/**
 * 初始化表单字段
 * @param {Array} value 表单字段
 * @param {Object} defaultvalue 默认值
 */
const initField = (value: any, defaultvalue: any) => {
  let field = {};

  if (isArray(value)) {
    field = value.reduce((pre: { [x: string]: string }, cur: string | number) => {
      pre[cur] = '';
      return pre;
    }, {});
  }

  if (isFunction(value)) field = value();

  if (isObject(defaultvalue)) {
    field = Object.assign(field, defaultvalue);
  }

  return field;
};

const checkTool: Record<string, any> = {
  required: (value: any, isReq: any, message: any) => (isReq && !value ? message : ''),
  max: (value: string | any[], length: number, message: any) => (value.length > length ? message : ''),
  min: (value: string | any[], length: number, message: any) => (value.length < length ? message : ''),
  whitespace: (
    value: { length: number; replace: (arg0: RegExp, arg1: string) => { (): any; new (): any; length: number } },
    _: any,
    message: any
  ) => (value.length > 0 && value.replace(/[\s\r\n]/g, '').length === 0 ? message : ''),
  pattern: (value: string, reg: { test: (arg0: any) => any }, message: any) =>
    value === '' ? '' : !reg.test(value) ? message : '',
  validator: (value: any, func: (arg0: any) => void) => {
    try {
      func(value);
    } catch (err) {
      return err.message || '';
    }
  }
};

/**
 * UI无关的表单hook
 * @param {Array} field 定义字段
 * @param {Object} option { rules, defaultField } 额外配置
 */
const useForm = (field: any, option: any = {}) => {
  const { rules, defaultField } = option;
  const [values, setValues] = useState(() => initField(field, defaultField));
  const [errors, setErrors] = useState({});

  /**
   * 对应字段改变
   * @param {Object} obj 变化的字段
   * @param {Boolean} isCheck 是否即时校验
   */
  const setFields = (obj: any, isCheck = true) => {
    if (!isObject(obj)) return;
    const newValues = Object.assign({ ...values }, obj);

    setValues(newValues);

    isCheck && validateFields(obj);
  };

  /**
   * 触发校验
   * @param {Object} obj 表单字段
   */
  const validateFields = (obj: any) => {
    try {
      const newError: any = { ...errors };
      let isErr = false;

      Object.entries(obj).forEach(([key, value]) => {
        const _rules = rules[key];

        _rules.some((rule: { [s: string]: unknown } | ArrayLike<unknown>) => {
          const [[rKey, rValue], [, msg]] = [...Object.entries(rule), []];
          const message = checkTool[rKey!](value, rValue, msg);

          newError[key] = message;
          !isErr && message && (isErr = true);

          return message;
        });
      });

      setErrors(newError);

      return isErr && newError;
    } catch (err) {
      return errors;
    }
  };

  /**
   * 设置错误信息
   * @param {Object} obj 错误字段
   */
  const setFieldsErr = (obj: any) => {
    if (!isObject(obj)) return;
    const newError = Object.assign({ ...errors }, obj);

    setErrors(newError);
  };

  /**
   * 提交表单
   */
  const onSubmit = () => {
    return new Promise((resolve, reject) => {
      const errInfo = validateFields(values);

      if (errInfo) {
        reject(errInfo);
      }

      resolve(values);
    });
  };

  return [
    values,
    errors,
    {
      setFields,
      setFieldsErr,
      onSubmit
    }
  ];
};

export { useForm };
