import React from 'react';
import { mount, shallow } from 'enzyme';
import { act, sleep } from '@/tests';
import { entityMusterData } from './mockData';
import EntityClassMuster from '../classMuster/entity/index';

jest.useFakeTimers();

const props = {
  nodes: [],
  current: 4,
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
      property_map: [{ entity_prop: { Type: 0, value: 'name' }, otl_prop: 'name' }]
    },
    properties: ['name', 'string'],
    properties_index: ['name'],
    source_table: [],
    source_type: 'automatic',
    task_id: ''
  },
  setSelectedElement: jest.fn()
};

const init = (props = { nodes: { name: '1' } }) => mount(<EntityClassMuster {...props} />);

describe('UI', () => {
  it('data render', async () => {
    const wrapper = shallow(<EntityClassMuster {...props} />);

    wrapper.setProps({
      nodes: entityMusterData.nodes
    });
    await sleep();
    jest.runOnlyPendingTimers(); // 让所有定时器立即执
  });
});
