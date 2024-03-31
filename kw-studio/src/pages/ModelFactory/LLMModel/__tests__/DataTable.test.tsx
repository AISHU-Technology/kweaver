import React from 'react';
import { mount } from 'enzyme';
import DataTable from '../DataTable';

const defaultProps = {
  disabledStatus: {},
  tableData: [],
  tableState: {} as any,
  modelConfig: {},
  onOperate: jest.fn(),
  onStateChange: jest.fn()
};
const init = (props = defaultProps) => mount(<DataTable {...props} />);

describe('LLMModel/DataTable', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
