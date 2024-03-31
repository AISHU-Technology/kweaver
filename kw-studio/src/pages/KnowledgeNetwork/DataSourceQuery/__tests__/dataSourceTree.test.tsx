import React from 'react';
import { mount } from 'enzyme';
import DataSourceTree from '../DataSourceTree';
import { sleep, act } from '@/tests';

const defaultProps = {
  treeData: [
    {
      id: 27,
      title: 'click',
      type: 'clickhouse',
      key: '2',
      data_source: 'clickhouse',
      children: [
        {
          title: 'kom',
          data_source: 'clickhouse',
          id: 27,
          type: 'base',
          key: '1',
          isLeaf: false
        }
      ],
      connect_type: '',
      dataType: 'structured'
    }
  ],
  loading: false,
  loadKey: '2',
  onLoadData: jest.fn(),
  refresh: jest.fn(),
  onChangeModalVisible: jest.fn,
  defaultExpandedKeys: ['click']
};
const init = (props = defaultProps) => mount(<DataSourceTree {...props} />);

describe('DataSourceTree', () => {
  it('test render', async () => {
    const wrapper = init();
    await sleep(10);
    wrapper.update();

    act(() => {
      wrapper.find('.ant-tree-switcher').at(0).simulate('click');
    });
  });
});
