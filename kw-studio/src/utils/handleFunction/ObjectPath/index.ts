import _ from 'lodash';
import { isObject } from '../isType';

/**
 * 扁平化对象, { a: { b: 1, c: 2 } } ==> { a.b: 1, a.c: 2 }
 * @param obj
 */
export const flatObject = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  const loop = (value: any, pKey?: string) => {
    if (!isObject(value) && pKey) {
      result[pKey] = value;
      return;
    }
    _.keys(value).forEach(key => {
      loop((value as any)[key], pKey ? `${pKey}.${key}` : key);
    });
  };
  loop(obj);
  return result;
};

/**
 * 解析对象路径, 仅考虑一维, { a.b: 1, a.c: 2 } ==> { a: { b: 1, c: 2 } }
 * @param obj
 */
export const parseObjectPath = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  _.entries(obj).forEach(([key, value]) => {
    let curObj = result;
    const keys: any = key.split('.');
    while (keys.length > 1) {
      const curKey = keys.shift()!;
      if (!curObj[curKey]) {
        curObj[curKey] = Object.create(null);
      }
      curObj = curObj[curKey];
    }
    curObj[keys[0]] = value;
  });
  return result;
};
