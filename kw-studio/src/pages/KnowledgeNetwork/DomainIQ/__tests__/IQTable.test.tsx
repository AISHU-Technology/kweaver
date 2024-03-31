import React from 'react';
import { mount } from 'enzyme';
import IQTable from '../IQTable';
import { mockIQList } from './mockData';

const { total, graph_intelligence_list, ...kgInfo } = mockIQList.res;
const tableData = graph_intelligence_list;
const tableState = {
  loading: false,
  query: '',
  page: 1,
  total: 0,
  rule: 'update_time',
  order: 'desc'
};
const defaultProps = {
  kgInfo,
  knData: {},
  data: [] as typeof tableData,
  tableState,
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<IQTable {...props} />);

describe('DomainIQ/IQTable', () => {
  it('test empty', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
