import React from 'react';
import _ from 'lodash';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import { act } from '@/tests';
import ServiceTable from '../ServiceTable';
import { knData, tableDataTwo, tableDataOne } from './mockData';

const defaultProps = {
  knData,
  onChange: jest.fn(),
  onCreate: jest.fn(),
  correlationGraph: [],
  isDrawer: false,
  setIsDrawer: jest.fn(),
  onTest: jest.fn(),
  onEdit: jest.fn()
};

const init = (props: any) => mount(<ServiceTable {...props} />);

describe('test UI', () => {
  it('test table empty', () => {
    const wrapper = init({
      ...defaultProps,
      data: [],
      tableState: { query: '', status: -1, kg_id: '-1' }
    });

    expect(wrapper.find('.analysis-search-service-table-root').at(0).exists()).toBe(true);
    expect(wrapper.find('.ant-table-column-has-sorters').at(0).text()).toBe(
      intl.get('cognitiveService.analysis.serviceName')
    );
  });

  it('test status is 2', () => {
    const wrapper = init({
      ...defaultProps,
      data: tableDataTwo,
      tableState: { query: '', status: -1, kg_id: '-1' }
    });
    expect(wrapper.find('.kw-ml-3').at(0).text()).toBe('详情');
  });
});

describe('Function test', () => {
  it('test status is 1', () => {
    const wrapper = init({
      ...defaultProps,
      data: tableDataOne,
      tableState: { query: '', status: -1, kg_id: '-1' }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('test status is 2', () => {
    const wrapper = init({
      ...defaultProps,
      data: tableDataTwo,
      tableState: { query: '', status: -1, kg_id: '-1' }
    });
    act(() => {
      wrapper.find('.kw-ml-3').at(0).simulate('click');
    });
  });
});
