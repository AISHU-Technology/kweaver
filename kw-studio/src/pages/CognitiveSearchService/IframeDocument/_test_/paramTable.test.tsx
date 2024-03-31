import React from 'react';
import { mount } from 'enzyme';
import ParamTable from '../Type1/paramTable';

const defaultProps = {
  tableData: [
    {
      name: 'service_id',
      type: 'string',
      required: 'true',
      description: '服务唯一id，创建服务时生成'
    },
    {
      name: 'knw_id',
      type: 'string',
      required: 'true',
      description: '知识网络id'
    }
  ]
};

const init = (props = defaultProps) => mount(<ParamTable {...props} />);

describe('test UI', () => {
  it('test table', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    const tableCell = wrapper.find('.ant-table-cell');
    // expect(tableCell.at(0).text()).toBe('名称');
    // expect(tableCell.at(1).text()).toBe('类型');
    // expect(tableCell.at(2).text()).toBe('是否必选');
    // expect(tableCell.at(3).text()).toBe('描述');
  });
});
