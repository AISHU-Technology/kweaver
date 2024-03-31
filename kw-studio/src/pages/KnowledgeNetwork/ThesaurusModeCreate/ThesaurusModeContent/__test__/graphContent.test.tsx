import React from 'react';
import { mount } from 'enzyme';
import GraphContent from '../GraphContent';
import { act } from '@/tests';

const defaultProps = {
  visible: false,
  setVisible: jest.fn(),
  tableData: [],
  setTableData: jest.fn(),
  mode: 'std',
  setIsChange: jest.fn(),
  setGraphTableDataTime: jest.fn(),
  tableLoading: false,
  tabKey: 'graph'
};
const init = (props = defaultProps) => mount(<GraphContent {...props} />);

describe('GraphContent UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
