import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import FunctionTable from '../FunctionTable';
import { functionLists } from './mockData';
jest.mock('@/services/functionManage', () => ({
  functionInfo: () =>
    Promise.resolve({
      res: {
        id: 2,
        name: 'function1',
        language: 'nGQL',
        code: 'lookup on v1 yield vertex as v;',
        description: 'description',
        knowledge_network_id: 1,
        parameters: [
          {
            name: 'id',
            example: 1,
            description: '描述1',
            position: [1, 5, 10]
          },
          {
            name: 'name',
            example: 'name1',
            description: '描述2',
            position: [2, 5, 10]
          }
        ],
        create_time: '2023-01-01 11:11:11',
        create_user: 'alex',
        create_email: 'alex@aishu.cn',
        update_time: '2023-01-01 11:11:11',
        update_user: 'alex',
        update_email: 'alex@aishu.cn'
      }
    })
}));

// jest.mock('@/services/rbacPermission', () => ({
//   dataPermission: () =>
//     Promise.resolve({
//       res: [
//         {
//           codes: ['FUNCTION_DELETE', 'FUNCTION_EDIT', 'FUNCTION_EDIT_PERMISSION', 'FUNCTION_VIEW'],
//           dataId: '2',
//           isCreator: 1
//         }
//       ]
//     })
// }));
const tableState = {
  loading: false, // 搜索加载中
  search: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  order: 'desc', // 时间排序方式
  rule: 'update_time', // 排序规则
  kw_id: 0, // 绑定的知识网络
  name: 'nGQL' // 函数名字
};

const defaultProps = {
  kgData: {},
  tableState,
  dataSource: functionLists,
  onChangeState: jest.fn(),
  onChangeDrawer: jest.fn(),
  setAuthFunction: jest.fn(),
  onSetFunctionInfo: jest.fn(),
  onDelete: jest.fn(),
  routeCache: {}
};

const init = (props = defaultProps) => mount(<FunctionTable {...props} />);

describe('function init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('test sort', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.functionTableRoot-sort-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-dropdown-menu-item .ant-dropdown-menu-item-only-child .menu-selected').at(0).simulate('click');
    });
  });
  it('test search', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { target: { value: '搜索' } });
  });
});

describe('test data', () => {
  it('edit', async () => {
    const wrapper = init({
      ...defaultProps,
      dataSource: functionLists,
      tableState: { ...tableState, total: functionLists.length }
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ant-table-row').length).toBe(functionLists.length);

    act(() => {
      wrapper.find('.ant-table-row').at(0).find('.ant-table-cell').at(0).simulate('click');
    });
  });
});
