import React from 'react';
import { shallow } from 'enzyme';
import TaskList from './index';
import { getFileType, analyUrl } from './assistFunction';

const props = {
  taskListData: [
    {
      celery_task_id: '441860ca-a5e6-44e9-b063-0812ef20ad4a',
      task_id: 11,
      task_name: 'Task1',
      task_status: 'finished',
      task_type: 'multi-files'
    }
  ],
  nodes: [
    {
      colour: '#805A9C',
      dataType: 'structured',
      data_source: 'as7',
      ds_address: 'https://10.2.174.249',
      ds_id: 2,
      ds_name: '249_结构化',
      ds_path: '123',
      entity_id: 7,
      extract_type: 'standardExtraction',
      file_type: 'csv',
      index: 0,
      model: '',
      name: 'nei1',
      source_type: 'automatic',
      task_id: 22
    }
  ],
  edges: [],
  selectedElement: '',
  used_task: [22]
};

const wrapperShallow = shallow(<TaskList {...props} />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<TaskList />);
  });

  it('renders without crashing', () => {
    shallow(<TaskList {...props} />);
  });
});
