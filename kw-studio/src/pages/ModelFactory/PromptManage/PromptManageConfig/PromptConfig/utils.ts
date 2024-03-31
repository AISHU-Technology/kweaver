import _ from 'lodash';
import moment from 'moment';
import { isDef, flatObject } from '@/utils/handleFunction';
import { uniquePromptId } from '@/components/PromptEditor';
import { TVariables, TModelParams } from '../types';
import { CODE_TEMPLATE } from './enums';

/**
 * 构造默认变量
 * @param names 变量名
 */
export const createVariables = (names: string[]): TVariables => {
  return _.map(names, name => ({
    id: uniquePromptId(),
    var_name: name,
    field_name: name,
    optional: false,
    field_type: 'textarea'
  }));
};

/**
 * 解析后端的默认模型参数
 * @param modelParam
 */
export const getDefaultModelOptions = (modelParam: Record<string, number[]>) => {
  return _.entries(modelParam).reduce((res, item) => {
    const [key, value] = item;
    res[key] = value[value.length - 1];
    return res;
  }, {} as TModelParams);
};

// 后端可能返回null
export const formatNumber = (num: any) => (isDef(num) ? num : undefined);

export const generateTimestamp = () => {
  return moment(new Date()).locale('en').format('hh:mm A');
};

/**
 * 填充数据到代码模板
 * @param data
 * @param codeTemplate
 */
export const formatCode = (data: Record<string, any>, codeTemplate?: string) => {
  const { model_series } = data;
  const flatData = flatObject(data);
  const temp =
    codeTemplate || CODE_TEMPLATE[model_series as keyof typeof CODE_TEMPLATE] || CODE_TEMPLATE['aishu-baichuan'];
  const code = temp.replace(/{{(.*?)}}/g, (matchText, $1) => {
    return isDef(flatData[$1]) ? flatData[$1] : matchText;
  });
  return code;
};

/**
 *解析ai回复的信息
 * @param message
 */
export const parseAImessage = (message: string) => {
  try {
    const result = JSON.parse(message);
    if (result.res) {
      return { ...result.res, code: 200 };
    }
    return { code: 500 };
  } catch {
    return { code: 500 };
  }
};

/**
 * 判断变量是否有误
 * @param variables
 */
export const isVariableErr = (variables: TVariables) => {
  return _.some(variables, item => !_.isEmpty(item.error));
};

/**
 * 矫正模型配置
 * @param oldOptions 原有模型配置
 * @param defaultOptions 包含最大最小值的模型配置信息
 */
export const getCorrectModelOptions = (oldOptions: TModelParams, defaultOptions: any) => {
  const newParams = { ...oldOptions };
  _.entries(defaultOptions).forEach(([key, [min, max]]: any[]) => {
    if (newParams[key] < min) newParams[key] = min;
    if (newParams[key] > max) newParams[key] = max;
  });
  return newParams;
};
