import React from 'react';
import { mount } from 'enzyme';
import FilterList from '.';
import { sleep } from '@/tests';

const defaultProps = {
  selectedItem: { detail: { kg: { kg_id: '1' } } },
  classData: [{ name: 'name' }, { name: 'path' }],
  setSearchConfig: jest.fn(),
  searchConfig: [
    {
      proList: [
        { name: 'name', type: 'string' },
        { name: 'path', type: 'string' },
        { name: 'gns', type: 'string' }
      ],
      tag: 'aa',
      data: [{ alias: '目录', color: '#d9534c', entity_id: 1, icon: 'graph-model', name: 'folder' }],
      properties: []
    }
  ]
};

const init = (props = defaultProps) => mount(<FilterList {...props} />);

describe('FilterList', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('change tag', async () => {
    const wrapper = init();
    () => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    };
    await sleep();
    wrapper.update();
    () => {
      wrapper.find('.ant-select-item-option').at(0).simulate('mousedown');
    };
  });
});
