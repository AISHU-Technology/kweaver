import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import IQTable from '../IQTable';
import { mockIQList } from './mockData';

const mockHistory = { push: jest.fn() };
jest.mock('react-router-dom', () => ({
  useHistory: () => mockHistory
}));
jest.mock('@/services/knowledgeNetwork', () => ({
  graphGetByKnw: () => Promise.resolve({ res: { df: [] } })
}));

const tableData = mockIQList.res.graph_intelligence_list;
const tableState = {
  loading: false,
  query: '',
  page: 1,
  total: 0,
  rule: 'last_task_time',
  order: 'desc'
};
const defaultProps = {
  kid: 1,
  data: [] as typeof tableData,
  tableState,
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<IQTable {...props} />);

describe('DomainIQ/IQTable', () => {
  it('test empty', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.ad-tip-img').exists()).toBe(true);
  });

  it('test render', () => {
    const wrapper = init({ ...defaultProps, data: tableData, tableState: { ...tableState, total: tableData.length } });
    expect(wrapper.find('.ant-table-row').length).toBe(tableData.length);

    wrapper.setProps({ tableState: { ...tableState, loading: true } });
    wrapper.update();
    expect(wrapper.find('.anticon-loading').exists()).toBe(true);
  });

  it('test operation btn', async () => {
    const spyPush = jest.spyOn(mockHistory, 'push');
    const wrapper = init({ ...defaultProps, data: tableData });
    const btnList = wrapper.find('.op-column').at(0).find('Button');
    act(() => {
      btnList.at(0).simulate('click');
    });
    await sleep();
    expect(spyPush.mock.calls[0][0].includes('/knowledge/network')).toBe(true);
    act(() => {
      btnList.at(1).simulate('click');
    });
    await sleep();
    expect(spyPush.mock.calls[1][0].includes('/knowledge/network')).toBe(true);
    act(() => {
      btnList.at(2).simulate('click');
    });
    await sleep();
    expect(spyPush.mock.calls[2][0].includes('/knowledge/engine/search')).toBe(true);
  });
});
