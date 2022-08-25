import React from 'react';
import { shallow } from 'enzyme';
import GraphShow from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<GraphShow />);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<GraphShow />);
  const instance = wrapperShallow.instance();

  test('test basic function', () => {
    expect(
      instance.setGraphShowData({
        edge: [
          {
            colour: '#D770A1',
            dataType: '',
            data_source: '',
            ds_id: '',
            ds_name: '',
            edge_id: 2,
            extract_type: '',
            file_type: '',
            model: '',
            name: 'kom_order_infotokom_order_info',
            relations: ['kom_order_info', 'kom_order_infotokom_order_info', 'kom_order_info'],
            source_table: [],
            source_type: 'manual',
            task_id: ''
          },
          {
            colour: '#3A4673',
            dataType: '',
            data_source: '',
            ds_id: '',
            ds_name: '',
            edge_id: 3,
            extract_type: '',
            file_type: '',
            model: '',
            name: 'testtotest',
            relations: ['test', 'testtotest', 'test'],
            source_table: [],
            source_type: 'manual',
            task_id: ''
          }
        ],
        entity: [
          {
            colour: '#68798E',
            dataType: 'structured',
            data_source: 'mysql',
            ds_id: '5',
            ds_name: 'mysql',
            ds_path: 'kom',
            entity_id: 2,
            extract_type: 'standardExtraction',
            file_type: '',
            index: 0,
            model: '',
            name: 'kom_order_info',
            task_id: '8'
          },
          {
            colour: '#ECB763',
            dataType: 'structured',
            data_source: 'hive',
            ds_id: '4',
            ds_name: 'hive',
            ds_path: 'test',
            entity_id: 3,
            extract_type: 'standardExtraction',
            file_type: '',
            index: 1,
            model: '',
            name: 'test',
            task_id: '9'
          }
        ]
      })
    ).toMatchObject({
      edges: [
        {
          color: '#D770A1',
          lineLength: 200,
          relation: 'kom_order_infotokom_order_info',
          // shirft: 2,
          source: 0,
          target: 0
        },
        { color: '#3A4673', lineLength: 200, relation: 'testtotest', source: 1, target: 1 }
      ],
      nodes: [
        {
          colour: '#68798E',
          dataType: 'structured',
          data_source: 'mysql',
          ds_id: '5',
          ds_name: 'mysql',
          ds_path: 'kom',
          entity_id: 2,
          extract_type: 'standardExtraction',
          file_type: '',
          index: 0,
          model: '',
          name: 'kom_order_info',
          task_id: '8'
        },
        {
          colour: '#ECB763',
          dataType: 'structured',
          data_source: 'hive',
          ds_id: '4',
          ds_name: 'hive',
          ds_path: 'test',
          entity_id: 3,
          extract_type: 'standardExtraction',
          file_type: '',
          index: 1,
          model: '',
          name: 'test',
          task_id: '9'
        }
      ]
    });

    expect(
      instance.handleEdge([], {
        color: '#F0E34F',
        index: 0,
        lineLength: 200,
        radius: 50,
        relation: 'kom_order_infotokom_order_info',
        source: 1,
        target: 1
      })
    ).toMatchObject({
      color: '#F0E34F',
      index: 0,
      lineLength: 200,
      radius: 50,
      relation: 'kom_order_infotokom_order_info',
      source: 1,
      target: 1
    });

    expect(instance.findNodeIndex('test', [{ name: 'test' }])).toBe(0);

    expect(
      instance.createGraph({
        nodes: [
          {
            colour: '#C64F58',
            dataType: 'structured',
            data_source: 'hive',
            ds_id: '4',
            ds_name: 'hive',
            ds_path: 'test',
            entity_id: 1,
            extract_type: 'standardExtraction',
            file_type: '',
            index: 0,
            model: '',
            name: 'nei1',
            source_table: ['nei1'],
            source_type: 'automatic',
            task_id: '4'
          },
          {
            colour: '#5C539B',
            dataType: 'structured',
            data_source: 'hive',
            ds_id: '4',
            ds_name: 'hive',
            ds_path: 'test',
            entity_id: 2,
            extract_type: 'standardExtraction',
            file_type: '',
            index: 1,
            model: '',
            name: 'nei2',
            source_table: ['nei2'],
            source_type: 'automatic',
            task_id: '4'
          }
        ],
        edges: [
          {
            color: '#3A4673',
            index: 0,
            lineLength: 200,
            relation: 'nei2tonei1',
            shirft: 2,
            source: 0,
            target: 1
          }
        ]
      })
    ).toBe();
  });
});
