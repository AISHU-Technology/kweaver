import _ from 'lodash';
import { TableState } from './types';
const data: any = [];
_.map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], (item: any) => {
  data.push({
    intentpool_name: '意图池名称意图池名称意图池名称意图池名称意图池名称',
    id: item,
    train_status: '训练成功',
    creator: '张三意图池名称意图池名称意图池名称',
    create_time: 1623950683,
    end_creator: '李思',
    edit_time: 1645738590,
    editor_id: 12,
    description: '关于华学院法项目啦啦啦啦啦啦啦啦哈哈哈'
  });
});

export const getList = (state: any) => {
  return {
    res: {
      count: 12,
      df: data
    }
  };
};
