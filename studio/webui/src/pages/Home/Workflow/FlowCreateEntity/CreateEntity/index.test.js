import React from 'react';
import { shallow, mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import NewCreateEntity from './index';

const init = (props = {}) => {
  const root = mount(
    <BrowserRouter>
      <NewCreateEntity {...props} />
    </BrowserRouter>
  );
  const wrapper = root.find('NewCreateEntity').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NewCreateEntity />);
  });
});

describe('function test', () => {
  const wrapperShallow = init();

  wrapperShallow.setState({
    nodes: [
      {
        colour: '#91C073',
        dataType: '',
        data_source: '',
        ds_name: '',
        ds_path: '',
        extract_type: '',
        file_type: '',
        ds_id: '',
        index: 0,
        model: '',
        name: '1',
        entity_id: 1,
        properties: [['name', 'string']],
        properties_index: ['name'],
        source_table: [],
        source_type: 'manual',
        task_id: '',
        ds_address: ''
      },
      {
        colour: '#805A9C',
        dataType: '',
        data_source: '',
        ds_name: '',
        ds_path: '',
        extract_type: '',
        file_type: '',
        ds_id: '',
        index: 1,
        model: '',
        name: '2',
        entity_id: 2,
        properties: [['name', 'string']],
        properties_index: ['name'],
        source_table: [],
        source_type: 'manual',
        task_id: '',
        ds_address: ''
      }
    ],
    edges: [
      [
        {
          colour: '#D9534C',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          edge_id: 1,
          extract_type: '',
          file_type: '',
          model: '',
          name: '1_2_2',
          properties: [['name', 'string']],
          properties_index: ['name'],
          relations: ['1', '1_2_2', '2'],
          source_table: [],
          source_type: 'manual',
          task_id: '',
          start: 1,
          end: 2,
          lineLength: 200,
          source: {
            colour: '#91C073',
            dataType: '',
            data_source: '',
            ds_name: '',
            ds_path: '',
            extract_type: '',
            file_type: '',
            ds_id: '',
            index: 0,
            model: '',
            name: '1',
            entity_id: 1,
            properties: [['name', 'string']],
            properties_index: ['name'],
            source_table: [],
            source_type: 'manual',
            task_id: '',
            ds_address: ''
          },
          target: {
            colour: '#805A9C',
            dataType: '',
            data_source: '',
            ds_name: '',
            ds_path: '',
            extract_type: '',
            file_type: '',
            ds_id: '',
            index: 1,
            model: '',
            name: '2',
            entity_id: 2,
            properties: [['name', 'string']],
            properties_index: ['name'],
            source_table: [],
            source_type: 'manual',
            task_id: '',
            ds_address: ''
          },
          shirft: 2,
          index: 0
        }
      ]
    ]
  });

  const instance = wrapperShallow.instance();

  test('test function checkSaveData', () => {
    expect(instance.checkSaveData(true)).toBe(true);
  });
});
