import _, { includes } from 'lodash';

export const getUniqueId = (prefix: any) => _.uniqueId(prefix);

// 初始化id
export const initIntention = (data: any[]) => {
  if (_.isEmpty(data)) return [];
  const result = _.map(data, item => {
    const slots = _.map(item?.slots, slot => ({ ...slot, id: getUniqueId('slot') }));
    return { ...item, slots, id: getUniqueId('intent') };
  });
  return result;
};

export const omitIntentId = (data: any[]) => {
  if (_.isEmpty(data)) return [];
  const result = _.map(data, item => {
    const slots = _.map(item?.slots, slot => _.omit(slot, 'id'));
    return { ..._.omit(item, 'id'), slots };
  });
  return result;
};

/** 大模型测试参数 */
export const intentConfig = (data: any[]) => {
  if (_.isEmpty(data)) return [];
  const result = _.map(data, item => {
    const slots = _.map(item?.slots, slot => _.omit(slot, 'id'));
    return { ..._.omit(item, ['id', 'intent']), slots, name: item?.intent };
  });
  return result;
};

/** 匹配参数 */
export const containsTemplateTags = (inputString: string, templateTags: string[]) => {
  const sanitizedTags = _.map(templateTags, tag => tag.trim());
  const regex = new RegExp(`\\{\\{\\s*(${sanitizedTags.join('|')})\\s*\\}\\}`, 'g');
  return regex.test(inputString);
};

/** 意图更新， 更新图分析配置 */
type EditDataType = {
  parent?: any;
  data: any;
  newData?: any;
  key: string;
};
// 更新槽位和跟新意图都用的这个方法 parent：{intent,description}更新槽位时所在的意图
// newData 更新值，{name, description}
// data 为原始数据 槽位名key：name  意图名key: intent
export const updateGaConfig = (gaConfig: any, editData: EditDataType) => {
  const { parent, key } = editData;
  if (!gaConfig?.intent_binding) return {};
  let result: any = {};
  if (key === 'delete') {
    if (parent) {
      result = _.map(gaConfig?.intent_binding, item => {
        if (item?.intent_name === parent?.intent) {
          const binding_info = _.map(item?.binding_info, bind => {
            if (editData?.data?.name === bind?.slot) return { ...bind, slot: '' };
            return bind;
          });
          const slots = _.filter(item?.slots, s => s?.name !== editData?.data?.name);
          return { ...item, slots, binding_info };
        }
        return item;
      });
    } else {
      result = _.filter(gaConfig?.intent_binding, item => item?.intent_name !== editData?.data?.intent);
    }
  }

  if (key === 'add') {
    if (parent) {
      result = _.map(gaConfig?.intent_binding, item => {
        if (item?.intent_name === parent?.intent) {
          const slots = [editData?.newData, ...item?.slots];
          return { ...item, slots };
        }
        return item;
      });
    } else {
      const add = [{ intent_name: editData?.newData?.intent, binding_info: [], graph_info: {}, kg_id: '' }];
      result = _.concat(add, gaConfig?.intent_binding);
    }
  }

  if (key === 'edit') {
    if (parent) {
      result = _.map(gaConfig?.intent_binding, item => {
        if (item?.intent_name === parent?.intent) {
          const binding_info = _.map(item?.binding_info, bind => {
            if (editData?.data?.name === bind?.slot) return { ...bind, slot: editData?.newData?.name };
            return bind;
          });
          const slots = _.map(item?.slots, s => {
            const name = editData?.data?.name === s?.name ? editData?.newData?.name : s.name;
            return { ...s, name };
          });
          return { ...item, slots, binding_info };
        }
        return item;
      });
    } else {
      result = _.map(gaConfig?.intent_binding, item => {
        if (item?.intent_name === editData?.data?.intent) {
          return { ...item, intent_name: editData?.newData?.name };
        }
        return item;
      });
    }
  }
  return result;
};
