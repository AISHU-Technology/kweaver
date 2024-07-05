/**
 * 判断数据类型
 */

const baseBool = (obj: any) => Object.prototype.toString.call(obj);

const isString = (str: any) => typeof str === 'string';

const isNumber = (num: any) => typeof num === 'number';

const isBigint = (num: any) => typeof num === 'bigint';

const isBoolean = (bool: any) => typeof bool === 'boolean';

const isFunction = (func: any) => typeof func === 'function';

const isUndefined = (obj: any) => typeof obj === 'undefined';

const isArray = (arr: any) => baseBool(arr) === '[object Array]';

const isObject = (obj: any) => baseBool(obj) === '[object Object]';

const isNull = (obj: any) => baseBool(obj) === '[object Null]';

const isDef = (value: any) => value !== undefined && value !== null;

export { baseBool, isString, isNumber, isBigint, isBoolean, isFunction, isArray, isObject, isUndefined, isNull, isDef };
