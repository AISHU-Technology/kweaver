import React from 'react';
import { shallow } from 'enzyme';
import EdgesModal from './index';

const props = {
  nodes: [
    {
      colour: '#354675',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 1,
      index: 3,
      model: 'Anysharedocumentmodel',
      name: 'text',
      properties: [['name', 'string', true]],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    },
    {
      colour: '#354675',

      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 2,
      index: 3,
      model: 'Anysharedocumentmodel',
      name: 'text2',
      properties: [['name', 'string', true]],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: ''
    }
  ]
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<EdgesModal {...props} />);
  });
});
