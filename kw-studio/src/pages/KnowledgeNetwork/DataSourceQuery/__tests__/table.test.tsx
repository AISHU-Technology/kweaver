import React from 'react';
import { mount } from 'enzyme';
import MyTable from '../Content/Table';

const defaultProps = {
  tableTitle: ['name', 'age', 'height'],
  tableData: [{ name: '张三', age: 18, height: 175 }],
  activeCol: 'height',
  loading: false
};
const init = (props = defaultProps) => mount(<MyTable {...props} />);

describe('MyTable', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
