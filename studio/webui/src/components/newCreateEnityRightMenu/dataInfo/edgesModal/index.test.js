import React from 'react';
import { shallow } from 'enzyme';
import NodeToEdgesModal from './index';

const props = {
  selectedElement: {
    colour: '#354675',
    dataType: '',
    data_source: '',
    ds_address: '',
    ds_id: '',
    ds_name: '',
    ds_path: '',
    entity_id: 4,
    extract_type: '',
    file_type: '',
    fx: 1128.142040727504,
    fy: 397.67772106452503,
    index: 3,
    model: 'Anysharedocumentmodel',
    name: 'text',
    properties: [['name', 'string', true]],
    properties_index: ['name'],
    source_table: [],
    source_type: 'automatic',
    task_id: '',
    vx: 0,
    vy: 0,
    x: 1128.142040727504,
    y: 397.67772106452503
  },
  nodes: [
    {
      colour: '#354675',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 1,
      extract_type: '',
      file_type: '',
      fx: 1128.142040727504,
      fy: 397.67772106452503,
      index: 3,
      model: 'Anysharedocumentmodel',
      name: 'text',
      properties: [['name', 'string', true]],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: '',
      vx: 0,
      vy: 0,
      x: 1128.142040727504,
      y: 397.67772106452503
    },
    {
      colour: '#354675',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 2,
      extract_type: '',
      file_type: '',
      fx: 1128.142040727504,
      fy: 397.67772106452503,
      index: 3,
      model: 'Anysharedocumentmodel',
      name: 'text2',
      properties: [['name', 'string', true]],
      properties_index: ['name'],
      source_table: [],
      source_type: 'automatic',
      task_id: '',
      vx: 0,
      vy: 0,
      x: 1128.142040727504,
      y: 397.67772106452503
    }
  ]
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NodeToEdgesModal {...props} />);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<NodeToEdgesModal {...props} />);
  const instance = wrapperShallow.instance();

  test('test function addEdge', () => {
    expect(instance.addEdge()).toBe();
  });

  test('test function deleteEdge', () => {
    wrapperShallow.setState({
      addEdges: [
        {
          colour: '#F0E34F',
          disable: 'start',
          endId: 4,
          endName: 'text',
          lineLength: 200,
          name: 'text_2_text',
          startId: 4,
          startName: 'text'
        },
        {
          colour: '#D9704C',
          disable: 'start',
          endId: 4,
          endName: 'text',
          lineLength: 200,
          name: 'text_2_text',
          startId: 4,
          startName: 'text'
        }
      ],
      edgeHasError: {
        content: '',
        index: 0,
        status: false
      }
    });

    expect(instance.deleteEdge(1)).toBe();

    wrapperShallow.setState({
      addEdges: [
        {
          colour: '#F0E34F',
          disable: 'start',
          endId: 4,
          endName: 'text',
          lineLength: 200,
          name: 'text_2_text',
          startId: 4,
          startName: 'text'
        }
      ],
      edgeHasError: {
        content: '',
        index: 0,
        status: false
      }
    });

    expect(instance.deleteEdge(0)).toBe();
  });

  test('test function select', () => {
    wrapperShallow.setState({
      addEdges: [
        {
          colour: '#50A06A',
          disable: 'end',
          endId: 4,
          endName: 'text',
          lineLength: 200,
          name: 'document_2_text',
          startId: 2,
          startName: 'document'
        }
      ]
    });

    expect(
      instance.selectStart(
        {
          data: {
            colour: '#448AFF',
            dataType: '',
            data_source: '',
            ds_address: '',
            ds_id: '',
            ds_name: '',
            ds_path: '',
            entity_id: 2,
            extract_type: '',
            file_type: '',
            index: 1,
            model: 'Anysharedocumentmodel',
            name: 'document'
          }
        },
        0
      )
    ).toBe();

    expect(
      instance.selectEnd(
        {
          data: {
            colour: '#448AFF',
            dataType: '',
            data_source: '',
            ds_address: '',
            ds_id: '',
            ds_name: '',
            ds_path: '',
            entity_id: 2,
            extract_type: '',
            file_type: '',
            index: 1,
            model: 'Anysharedocumentmodel',
            name: 'document'
          }
        },
        0
      )
    ).toBe();

    wrapperShallow.setState({
      addEdges: [
        {
          colour: '#50A06A',
          disable: 'end',
          endId: 4,
          endName: 'text',
          lineLength: 200,
          name: 't',
          startId: 2,
          startName: 'document'
        }
      ]
    });

    expect(
      instance.selectStart(
        {
          data: {
            colour: '#448AFF',
            dataType: '',
            data_source: '',
            ds_address: '',
            ds_id: '',
            ds_name: '',
            ds_path: '',
            entity_id: 2,
            extract_type: '',
            file_type: '',
            index: 1,
            model: 'Anysharedocumentmodel',
            name: 'document'
          }
        },
        0
      )
    ).toBe();

    expect(
      instance.selectEnd(
        {
          data: {
            colour: '#448AFF',
            dataType: '',
            data_source: '',
            ds_address: '',
            ds_id: '',
            ds_name: '',
            ds_path: '',
            entity_id: 2,
            extract_type: '',
            file_type: '',
            index: 1,
            model: 'Anysharedocumentmodel',
            name: 'document'
          }
        },
        0
      )
    ).toBe();
  });

  test('test function copy', () => {
    expect(
      instance.copy({
        colour: '#805A9C',
        disable: 'start',
        endId: 2,
        endName: 'document',
        lineLength: 200,
        name: 'chapter_2_document',
        startId: 3,
        startName: 'chapter'
      })
    ).toBe();
  });

  test('test function save', () => {
    expect(instance.save()).toBe();
  });

  test('test function exchangeData', () => {
    wrapperShallow.setState({
      addEdges: [
        {
          colour: '#3A4673',
          disable: 'end',
          endId: 3,
          endName: 'chapter',
          lineLength: 200,
          name: 'document_2_chapter',
          startId: 2,
          startName: 'document'
        }
      ]
    });

    expect(
      instance.exchangeData(
        {
          colour: '#3A4673',
          disable: 'start',
          endId: 2,
          endName: 'document',
          lineLength: 200,
          name: 'chapter_2_document',
          startId: 3,
          startName: 'chapter'
        },
        0
      )
    ).toBe();
  });
});
