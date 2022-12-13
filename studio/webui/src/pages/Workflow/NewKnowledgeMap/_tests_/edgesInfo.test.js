import React from 'react';
import { mount, shallow } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';
import entityMusterData from '../classMuster/entity/index';
import EdgeInfo from '../classInfo/ralationInfo/index';

const props = {
  selectedElement: {
    Type: 0,
    alias: '145_2_125',
    colour: '#68798E',
    dataType: '',
    data_source: undefined,
    ds_address: '',
    ds_id: '',
    ds_name: '',
    ds_path: undefined,
    edgeInfo: {
      attrSelect: [('Customer', '_id_lawFirm', 'leaderPartner', 'name', 'lawFirm', 'contractorPartner')],
      entity_type: { Type: 0, value: 'customer' },
      otl_name: '145_2_125',
      property_map: [
        {
          edge_prop: 'name',
          entity_prop: { Type: 0, value: 'name' }
        },
        {
          edge_prop: 'alias',
          entity_prop: { Type: 0, value: 'name' }
        }
      ]
    },
    edge_id: 1,
    extract_type: '',
    file_type: '',
    model: 'Anysharedocumentmodel',
    moreFile: {
      begin_class_prop: {},
      equation_begin: '包含',
      relation_begin_pro: {},
      equation: '',
      relation_end_pro: {}
    },
    name: '145_2_125',
    properties: [
      ['name', 'string'],
      ['alias', 'string']
    ],
    properties_index: ['name', 'alias'],
    relations: ['text', '145_2_125', 'clause'],
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
  nodes: [
    {
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
        property_map: [{ entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' }]
      },
      properties: ['name', 'string'],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      Type: 1,
      alias: '条款',
      colour: '#019688',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 12,
      extract_type: '',
      file_type: '',
      model: 'Generalmodel',
      name: 'clause',
      nodeInfo: {
        otl_name: 'clause',
        property_map: [
          { entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 0, value: 'content' }, otl_prop: 'content' }
        ],
        entity_type: { Type: 1, value: 'clause' },
        attrSelect: [
          { entity_prop: { Type: 2, value: 'name' }, otl_prop: 'name' },
          { entity_prop: { Type: 2, value: 'content' }, otl_prop: 'content' }
        ]
      },
      properties: [
        ['name', 'string'],
        ['content', 'string']
      ],
      properties_index: (2)[('name', 'content')],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    }
  ],
  changeEdgeInfo: jest.fn(),
  changeMoreFile: jest.fn(),
  changeEdgeType: jest.fn(),
  setSelectedElement: jest.fn(),
  changeTab: jest.fn()
};

const init = props =>
  mount(
    <Provider store={store}>
      <EdgeInfo {...props} store={store} />
    </Provider>
  );

describe('UI', () => {
  it('data render', async () => {
    init(props);
    await sleep();
  });
});

describe('UI', () => {
  it('selected', async () => {
    const wrapper = init(props);

    act(() => {
      wrapper.find('.ant-select-selection-search').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-item').at(1).simulate('click');
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
