import React from 'react';
import { mount } from 'enzyme';
import IntentionTable from '../IntentionTable';
import { tableData, tableDataTwo, tableDataOne } from './mockData';

const defaultProps = {
  onCreateEdit: jest.fn(),
  onChangeTable: jest.fn()
};

const init = (props: any) => mount(<IntentionTable {...props} />);

describe('test UI', () => {
  it('table empty', () => {
    const wrapper = init({
      ...defaultProps,
      tableData: [],
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('table do not empty', () => {
    const wrapper = init({
      ...defaultProps,
      tableData,
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('test train fail', async () => {
    const wrapper = init({
      ...defaultProps,
      tableData: tableDataTwo,
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('test training', async () => {
    const wrapper = init({
      ...defaultProps,
      tableData: tableDataOne,
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });
});

describe('Function test', () => {
  it('test train fail', async () => {
    const wrapper = init({
      ...defaultProps,
      tableData: tableDataTwo,
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('table do not empty', () => {
    const wrapper = init({
      ...defaultProps,
      tableData,
      tableState: { search_name: '', filter_statue: '-1', loading: false, page: 1, count: 0 }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
