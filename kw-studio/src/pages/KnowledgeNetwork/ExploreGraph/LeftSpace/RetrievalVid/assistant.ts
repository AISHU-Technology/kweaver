import _ from 'lodash';

// 处理过滤参数
export const getSearchConfig = (data: any) => {
  let search_config: any = [];

  _.forEach(data, item => {
    if (_.isEmpty(item?.properties)) {
      search_config = [...search_config, { tag: item?.tag }];
    } else {
      let properties: any = [];
      _.forEach(item?.properties, pro => {
        const { name, operation, op_value } = pro;
        // op_value 都为字符串类型
        if (!_.isEmpty(op_value) || _.isNumber(op_value)) {
          if (operation === 'btw') {
            properties = [
              ...properties,
              { name, operation: 'gt', op_value: `${op_value?.[0]}` },
              { name, operation: 'lt', op_value: `${op_value?.[1]}` }
            ];
          } else {
            properties = [...properties, { name, operation, op_value: `${op_value}` }];
          }
        }
      });
      search_config = [...search_config, { tag: item?.tag, properties }];
    }
  });

  return search_config;
};
