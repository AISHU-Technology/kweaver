import _ from 'lodash';

/**
 * 检查分区配置参数格式转换
 */
export const formatConversion = (values: any) => {
  const selectValues = Object.entries(values);
  const selectArray = _.filter(selectValues, (item: any) => item[0].slice(0, 6) === 'select');
  const inputArray: any = [];
  _.filter(selectValues, (item: any) => {
    if (item[0].slice(0, 5) === 'input') {
      inputArray.push(item[1]);
    }
  });
  const partition_infos = _.reduce(
    selectArray,
    (pre: any, key: any, i: any) => {
      pre[key[1]] = inputArray[i];
      return pre;
    },
    {}
  );
  return partition_infos;
};

/**
 * 编辑时配置数据格式转换
 */
export const editConversion = (data: any) => {
  const editKeys = Object?.keys(data);
  const editValues = Object?.values(data);
  const editSelect = _.reduce(
    editKeys,
    (pre: any, key: any, i: any) => {
      pre[`select_${i}`] = key;
      return pre;
    },
    {}
  );
  const editInput = _.reduce(
    editValues,
    (pre: any, key: any, i: any) => {
      pre[`input_${i}`] = key;
      return pre;
    },
    {}
  );
  const newAddCount = _.reduce(
    editKeys,
    (pre: any, key: any, i: any) => {
      pre[i] = i;
      return pre;
    },
    []
  );
  const editSaveAll = { ...editSelect, ...editInput };
  return { editSaveAll, newAddCount };
};

/**
 * 处理选择
 */
export const onHandleSelectFormat = (saveAllMes: any, isDelete = false, newFilterArray?: any) => {
  if (isDelete) {
    const handleInputMes = _.reduce(
      saveAllMes,
      (pre: any, key: any, index: any) => {
        if (key[0].includes('select_') && newFilterArray.includes(parseInt(key[0].split('_')[1]))) {
          pre[`select_${key[0].split('_')[1]}`] = key[1];
        }
        if (key[0].includes('input_') && newFilterArray.includes(parseInt(key[0].split('_')[1]))) {
          pre[`input_${key[0].split('_')[1]}`] = key[1];
        }

        return pre;
      },
      {}
    );
    return { handleInputMes };
  }
  const handleInputMes = _.reduce(
    saveAllMes,
    (pre: any, key: any, index: any) => {
      if (key[0].includes('select_')) {
        pre[`select_${key[0].split('_')[1]}`] = key[1];
      }
      if (key[0].includes('input_')) {
        pre[`input_${key[0].split('_')[1]}`] = key[1];
      }

      return pre;
    },
    {}
  );
  return { handleInputMes };
};

// 分区字段错误
export const onPartitionError = (data: any, res: any, type: string) => {
  const keyArr: any = [];
  if (type === 'variable') {
    _.map(Object.entries(data), (item: any, index: any) => {
      if (res?.partition_expression_error.includes(item[1]) && item[0].includes('select_')) {
        keyArr.push(item[0]);
      }
    });
    return keyArr;
  }
  if (type === 'select') {
    _.map(Object.entries(data), (item: any, index: any) => {
      if (res?.partition_name_error.includes(item[0]) && item[0].includes('select_')) {
        keyArr.push(item[0]);
      }
    });
  }
};
