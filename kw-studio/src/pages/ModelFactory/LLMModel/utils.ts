import _ from 'lodash';

/**
 * 解析后端数据
 * @param data 后端数据
 * @param language 当前语言
 */
export const parseModelConfig = (data: Record<string, any>[], language = 'zh-CN') => {
  const result: Record<string, any> = {};
  _.forEach(data, (d: any) => {
    _.keys(d).forEach(dKey => {
      const config = d[dKey];
      _.keys(config).forEach(cKey => {
        const value = config[cKey];
        if (value?.['zh-CN']) {
          config[cKey] = getTextByLang(value, language);
          return;
        }
        if (cKey === 'formData') {
          config[cKey] = _.map(value, item => {
            return {
              ...item,
              label: getTextByLang(item.label, language),
              placeholder: getTextByLang(item.placeholder, language),
              rules: parseRules(item.rules, language)
            };
          });
          return;
        }
        config[cKey] = value;
      });
      config._model = dKey;
      result[dKey] = config;
    });
  });

  return result;
};

/**
 * 解析表单校验规则
 */
export const parseRules = (rules?: any[], language = 'zh-CN') => {
  if (!rules) return [];
  return _.map(rules, (rule: any) => {
    if (rule.pattern) {
      rule.pattern = new RegExp(rule.pattern);
    }
    rule.message = getTextByLang(rule.message, language);
    return rule;
  });
};

/**
 * 解析中英文
 */
const getTextByLang = (data: any, language = 'zh-CN') => {
  if (typeof data === 'string') return data;
  return data?.[language] || data?.['zh-CN'] || data;
};
