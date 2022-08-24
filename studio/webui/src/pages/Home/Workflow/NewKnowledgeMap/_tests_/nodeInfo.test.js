import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import NodeInfo from '../classInfo/nodeInfo/index';

const props = {
  selectedElement: {
    alias: '正文',
    colour: '#607D8B',
    dataType: '',
    data_source: '',
    ds_address: '',
    ds_id: '',
    ds_name: '',
    ds_path: '',
    entity_id: 4,
    extract_type: '',
    file_type: '',
    model: 'Anysharedocumentmodel',
    name: 'text',
    nodeInfo: {
      attrSelect: ['name'],
      entity_type: { value: 'text', Type: 0 },
      otl_name: 'text',
      property_map: [
        { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
        { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'age' }
      ]
    },
    properties: [
      ['name', 'string'],
      ['age', 'string']
    ],
    properties_index: ['name', 'age'],
    source_table: [],
    source_type: 'automatic',
    task_id: ''
  },
  mapEntity: [
    {
      entity_prop: ['name', 'subindustry', '_id', 'industry'],
      entity_type: 'industry',
      key_property: ['name', 'subindustry', '_id', 'industry']
    },
    {
      entity_prop: ['name', 'subindustry', '_id', 'industry'],
      entity_type: 'document',
      key_property: ['name', 'subindustry', '_id', 'industry']
    }
  ],
  fromRelation: {},
  relationInfo: {},
  setSelectedElement: jest.fn(),
  changeNodeInfo: jest.fn(),
  changeNodeType: jest.fn(),
  changeTab: jest.fn()
};

const init = (props = { nodes: { name: '1' } }) => mount(<NodeInfo {...props} />);

describe('UI', () => {
  it('data render', async () => {
    init(props);
    await sleep();
  });
});

describe('function test', () => {
  it('select', async () => {
    const wrapper = init(props);

    act(() => {
      wrapper.find('.ant-select-selection-search').at(0).simulate('mousedown');
    });

    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-item').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-selection-search').at(1).simulate('mousedown');
    });

    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-item').at(4).simulate('click');
    });

    await sleep();
    wrapper.update();
    const btn = wrapper.find('.clear').at(0);

    act(() => {
      btn.simulate('click');
    });
    await sleep();
    wrapper.update();
    const sureBtn = wrapper.find('.ant-btn.ant-btn-primary.add-modal-save');

    sureBtn.simulate('click');
  });
});
