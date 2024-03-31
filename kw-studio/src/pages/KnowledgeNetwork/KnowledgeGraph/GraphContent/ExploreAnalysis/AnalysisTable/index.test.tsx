import React from 'react';
import AnalysisTable from './index';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';

jest.mock('@/services/visualAnalysis', () => ({
  visualAnalysisAdd: jest.fn(() => Promise.resolve({ res: [] })),
  visualAnalysisDelete: jest.fn(() => Promise.resolve({ res: 18 }))
}));

const defaultProps: any = {
  dataSource: [
    {
      c_id: 43,
      knw_id: 3,
      canvas_name: '未命名1',
      canvas_info: null,
      kg: { kg_id: 9, name: 'orientdb' },
      create_user: { name: '用户', email: 'yh@aishu.cn' },
      create_time: '2023-03-21 10:56:01',
      update_user: { name: '用户', email: 'yh@aishu.cn' },
      update_time: '2023-03-21 10:56:01',
      canvas_body: '--'
    }
  ],
  onChangeState: jest.fn(),
  kwId: 1,
  tableState: {
    loading: false,
    query: '',
    page: 1,
    total: 0,
    order_type: 'desc',
    order_field: 'update_time',
    kg_id: 0,
    kg_name: ''
  },
  graphList: []
};
const init = (props = defaultProps) => mount(<AnalysisTable {...props} />);

describe('test UI', () => {
  it('class is exists', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('test other UI', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.find('Button').at(0).text()).toBe('新建');
  });
});

describe('test Function', () => {
  it('test search', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { target: { value: '搜索' } });
  });
});
