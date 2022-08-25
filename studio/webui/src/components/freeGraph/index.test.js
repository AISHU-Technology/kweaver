/* eslint-disable max-lines */
import React from 'react';
import { shallow } from 'enzyme';
import FreeGraph from './index';
import {
  handleExternalImport,
  setColor,
  setEdgeShift,
  getNodesToEdgesId,
  changeNodeInfo,
  changeEdgeInfo,
  handleBatchAddEdges,
  handleTaskImport,
  isFlow,
  handleInvalidData
} from './assistFunction';

const wrapperShallow = shallow(<FreeGraph />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<FreeGraph />);
  });
});

describe('function test', () => {
  test('test function markerRing', () => {
    expect(instance.markerRing('#ffffff', 50)).toBe('url(#ring#ffffff)');
  });

  test('test function markerStart', () => {
    expect(instance.markerStart('#ffffff')).toBe('url(#start#ffffff)');
  });

  test('test function markerEnd', () => {
    expect(instance.markerEnd('#ffffff')).toBe('url(#end#ffffff)');
  });

  test('test function componentDidMount', () => {
    const componentDidMountSpy = jest.spyOn(FreeGraph.prototype, 'componentDidMount');

    shallow(<FreeGraph />);
    expect(componentDidMountSpy).toHaveBeenCalled();

    componentDidMountSpy.mockRestore();
  });

  test('test function componentDidUpdate', () => {
    const props = {
      current: 1
    };

    const componentDidUpdateSpy = shallow(<FreeGraph {...props} />);

    const componentDidMountS = jest.spyOn(FreeGraph.prototype, 'componentDidUpdate');

    componentDidUpdateSpy.setProps({ current: 2 });

    shallow(<FreeGraph />);
    expect(componentDidMountS).toHaveBeenCalled();

    componentDidMountS.mockRestore();
  });

  test('test function createGraph', () => {
    expect(instance.createGraph()).toBe(undefined);
  });

  test('test function tick', () => {
    expect(instance.tick()).toBe(undefined);
  });

  test('test function cancelCreate', () => {
    expect(instance.cancelCreate()).toBe(undefined);
  });

  test('test function cancelCreate', () => {
    expect(instance.cancelCreate({ srcElement: { localName: 'svg', id: 'createEntityGraph' } })).toBe(undefined);
  });

  test('test function cancelCreate', () => {
    expect(instance.cancelCreate({ srcElement: { localName: 'path', id: 'createEntityGraph1' } })).toBe(undefined);
  });

  test('test function initData', () => {
    expect(instance.initData()).toBe(undefined);
  });

  test('test function addNode', () => {
    expect(instance.addNode()).toBe(undefined);
  });

  test('test function addLine', () => {
    expect(instance.addLine({ index: 0, entity_id: 1, name: 'start' }, { index: 0, entity_id: 1, name: 'start' })).toBe(
      undefined
    );
  });

  test('test function deleteNodes', () => {
    expect(instance.deleteNodes([1])).toBe(undefined);
  });

  test('test function deleteEdges', () => {
    expect(instance.deleteEdges([1], [], [], [])).toBe(undefined);
  });

  test('test function deleteNodesNoTask', () => {
    expect(instance.deleteNodesNoTask([1])).toBe(undefined);
  });

  test('test function deleteEdgesNoTask', () => {
    expect(instance.deleteEdgesNoTask([1])).toBe(undefined);
  });

  test('test function deleteTask', () => {
    expect(
      instance.deleteTask({
        deleteEdges: [1],
        oldNodes: [],
        newNodes: [],
        deleteNodes: [0],
        oldEdges: [],
        newEdges: []
      })
    ).toMatchObject({});
  });

  test('test function updateNodes', () => {
    expect(
      instance.updateNodes([
        {
          colour: '#ffffff',
          dataType: '',
          data_source: '',
          ds_name: '',
          ds_path: '',
          extract_type: '',
          file_type: '',
          ds_id: '',
          index: 0,
          model: '',
          name: 'test',
          entity_id: 0,
          properties: ['name', 'string'],
          properties_index: ['name'],
          source_table: [],
          source_type: '',
          task_id: '',
          ds_address: ''
        }
      ])
    ).toBe(undefined);
  });

  test('test function updateEdges', () => {
    expect(
      instance.updateEdges(
        [
          {
            source: 0,
            target: 0,
            start: 0,
            end: 0,
            lineLength: 200,
            name: 'test1_2_test2',
            edge_id: 0,
            colour: '#ffffff',
            dataType: '',
            ds_name: '',
            data_source: '',
            ds_id: '',
            extract_type: '',
            file_type: '',
            model: '',
            properties: [['name', 'string']],
            properties_index: ['name'],
            source_type: 'manual',
            task_id: '',
            source_table: [],
            ds_address: ''
          }
        ],
        [
          {
            source: 0,
            target: 0,
            start: 0,
            end: 0,
            lineLength: 200,
            name: 'test1_2_test2',
            edge_id: 0,
            colour: '#ffffff',
            dataType: '',
            ds_name: '',
            data_source: '',
            ds_id: '',
            extract_type: '',
            file_type: '',
            model: '',
            properties: [['name', 'string']],
            properties_index: ['name'],
            source_type: 'manual',
            task_id: '',
            source_table: [],
            ds_address: ''
          },
          {
            source: 0,
            target: 0,
            start: 0,
            end: 0,
            lineLength: 200,
            name: 'test2_2_test3',
            edge_id: 1,
            colour: '#ffffff',
            dataType: '',
            ds_name: '',
            data_source: '',
            ds_id: '',
            extract_type: '',
            file_type: '',
            model: '',
            properties: [['name', 'string']],
            properties_index: ['name'],
            source_type: 'manual',
            task_id: '',
            source_table: [],
            ds_address: ''
          }
        ]
      )
    ).toBe(undefined);
  });

  test('test function externalImport', () => {
    expect(
      instance.externalImport({
        all_task: [],
        creat_time: '2021-06-15 17:34:37',
        create_user: 'admin',
        edge: [],
        entity: [],
        id: 26,
        inPutType: 'entity',
        ontology_des: '',
        ontology_name: 'test_3',
        used_task: []
      })
    ).toBe(undefined);
  });

  test('test function taskImport', () => {
    expect(
      instance.taskImport([
        {
          nodes: [
            {
              colour: '#ECB763',
              dataType: 'structured',
              data_source: 'hive',
              ds_address: '10.4.81.21',
              ds_id: 2,
              ds_name: 'hive',
              ds_path: 'test',
              extract_type: 'standardExtraction',
              file_type: '',
              name: 'nei1',
              properties: [['name', 'string']],
              properties_index: ['name'],
              source_table: ['nei1'],
              source_type: 'automatic',
              ask_id: 3,
              uniqueMarker: 1777
            }
          ],
          edges: []
        }
      ])
    ).toBe(undefined);
  });

  test('test function batchAddEdges', () => {
    expect(instance.batchAddEdges([])).toBe(undefined);
  });

  test('test function clickEdge', () => {
    expect(
      instance.clickEdge(
        {
          colour: '#5F81D8',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          edge_id: 1,
          end: 5,
          extract_type: '',
          file_type: '',
          index: 0,
          lineLength: 200,
          model: '',
          name: 'commend_entity_repeat_2_nei2',
          properties: [['name', 'string']],
          properties_index: ['name'],
          shirft: 2,
          source: { entity_id: 0 },
          source_table: [],
          source_type: 'manual',
          start: 4,
          target: { entity_id: 1 },
          task_id: ''
        },
        0
      )
    ).toBe(undefined);
  });

  test('test function selectHighLight', () => {
    expect(instance.selectHighLight()).toBe(undefined);
  });

  test('test function selectHighLight node', () => {
    expect(instance.selectHighLight({ entity_id: 0 })).toBe(undefined);
  });

  test('test function selectHighLight edge', () => {
    expect(instance.selectHighLight({ edge_id: 0 })).toBe(undefined);
  });

  test('test function addFive', () => {
    expect(instance.addFive({ task_id: 0 })).toBe(undefined);
  });

  test('test create graph', () => {
    const props = {
      nodes: [
        {
          colour: '#3A4673',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          ds_path: '',
          entity_id: 9,
          extract_type: '',
          file_type: '',
          fx: 889.2903171327802,
          fy: 555.3872505964497,
          index: 0,
          model: '',
          name: '1',
          properties: [['name', 'string']],
          properties_index: ['name'],
          source_table: [],
          source_type: 'manual',
          task_id: '',
          x: 889.2903171327802,
          y: 555.3872505964497
        },
        {
          colour: '#54639C',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          ds_path: '',
          entity_id: 10,
          extract_type: '',
          file_type: '',
          fx: 1020.7096828672198,
          fy: 404.61274940355037,
          index: 1,
          model: '',
          name: '2',
          properties: ['name', 'string'],
          properties_index: ['name'],
          source_table: [],
          source_type: 'manual',
          task_id: '',
          x: 1020.7096828672198,
          y: 404.61274940355037
        }
      ],
      edges: [
        {
          colour: '#68798E',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          edge_id: 12,
          end: 10,
          extract_type: '',
          file_type: '',
          index: 0,
          lineLength: 200,
          model: '',
          name: '1_2_2',
          properties: [['name', 'string']],
          properties_index: ['name'],
          relations: ['1', '1_2_2', '2'],
          shirft: 2,
          source: 0,
          source_table: [],
          source_type: 'manual',
          start: 9,
          target: 1,
          task_id: ''
        }
      ]
    };

    shallow(<FreeGraph {...props} />);
  });
});

describe('assistFunction test', () => {
  test('test function handleInvalidData', () => {
    expect(
      handleInvalidData([
        {
          colour: '#ffffff',
          dataType: '',
          data_source: '',
          ds_name: '',
          ds_path: '',
          extract_type: '',
          file_type: '',
          ds_id: '',
          index: 0,
          model: '',
          name: 'test1',
          entity_id: 0,
          properties: ['name', 'string'],
          properties_index: ['name'],
          source_table: [],
          source_type: '',
          task_id: '',
          ds_address: '',
          alias: ''
        },
        {
          colour: '#ffffff',
          dataType: '',
          data_source: '',
          ds_name: '',
          ds_path: '',
          extract_type: '',
          file_type: '',
          ds_id: '',
          index: 1,
          model: '',
          name: 'test2',
          entity_id: 1,
          properties: ['name', 'string'],
          properties_index: ['name'],
          source_table: [],
          source_type: '',
          task_id: '',
          ds_address: '',
          alias: ''
        }
      ])
    ).toStrictEqual([
      {
        colour: '#ffffff',
        dataType: '',
        data_source: '',
        ds_address: '',
        ds_id: '',
        ds_name: '',
        ds_path: '',
        entity_id: 0,
        extract_type: '',
        file_type: '',
        index: 0,
        model: '',
        name: 'test1',
        properties: ['name', 'string'],
        properties_index: ['name'],
        source_table: [],
        source_type: '',
        task_id: '',
        alias: ''
      },
      {
        colour: '#ffffff',
        dataType: '',
        data_source: '',
        ds_address: '',
        ds_id: '',
        ds_name: '',
        ds_path: '',
        entity_id: 1,
        extract_type: '',
        file_type: '',
        index: 1,
        model: '',
        name: 'test2',
        properties: ['name', 'string'],
        properties_index: ['name'],
        source_table: [],
        source_type: '',
        task_id: '',
        alias: ''
      }
    ]);
  });

  test('test function setEdgeShift', () => {
    expect(
      setEdgeShift({ edge_id: 1, start: 0, end: 1 }, [
        { edge_id: 2, start: 2, end: 3 },
        { edge_id: 3, start: 0, end: 1 }
      ])
    ).toEqual({
      edge_id: 1,
      end: 1,
      shirft: 1.6,
      start: 0
    });
  });

  test('test function setColor', () => {
    expect(setColor()).toBeTruthy();
  });

  test('test function getNodesToEdgesId', () => {
    expect(getNodesToEdgesId([0], [{ start: 0, end: 1, edge_id: 0 }])).toEqual([0]);
  });

  test('test function changeNodeInfo', () => {
    expect(
      changeNodeInfo(
        { color: { hex: '#ffffff' }, name: 'test', property: [['name', 'string']] },
        [{ color: { hex: '#000000' }, name: 'test2', property: [['name', 'string']], entity_id: 1 }],
        { entity_id: 1 }
      )
    ).toEqual([
      {
        color: { hex: '#000000' },
        colour: '#ffffff',
        entity_id: 1,
        name: 'test',
        properties: [['name', 'string']],
        properties_index: [],
        property: [['name', 'string']]
      }
    ]);
  });

  test('test function changeEdgeInfo', () => {
    expect(
      changeEdgeInfo(
        { color: { hex: '#ffffff' }, name: 'test', property: [['name', 'string']] },
        [{ color: { hex: '#000000' }, name: 'test2', property: [['name', 'string']], edge_id: 1 }],
        { edge_id: 1 }
      )
    ).toEqual([
      {
        color: { hex: '#000000' },
        colour: '#ffffff',
        edge_id: 1,
        name: 'test',
        properties: [['name', 'string']],
        properties_index: [],
        property: [['name', 'string']]
      }
    ]);
  });

  test('test function setColor', () => {
    expect(isFlow()).toBeFalsy();
  });

  test('test function handleBatchAddEdges', () => {
    expect(
      handleBatchAddEdges(
        [
          {
            colour: '#3A4673',
            endId: 10,
            endName: '2',
            lineLength: 200,
            name: '1_2_2',
            startId: 9,
            startName: '1',
            alias: ''
          }
        ],
        [],
        [{ entity_id: 9 }, { entity_id: 10 }],
        12
      )
    ).toStrictEqual({
      edge_id: 13,
      newAddEdges: [
        {
          alias: '1_2_2',
          colour: '#3A4673',
          dataType: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          edge_id: 12,
          end: 10,
          extract_type: '',
          file_type: '',
          lineLength: 200,
          model: '',
          name: '1_2_2',
          properties: [['name', 'string']],
          properties_index: ['name'],
          shirft: 2,
          source: 0,
          source_table: [],
          source_type: 'manual',
          start: 9,
          target: 1,
          task_id: ''
        }
      ]
    });
  });

  test('test function handleTaskImport', () => {
    expect(
      handleTaskImport({
        savedNodes: [],
        entity_id: 10,
        edge_id: 12,
        data: [
          {
            nodes: [
              {
                colour: '#C64F58',
                dataType: 'structured',
                data_source: 'hive',
                ds_address: '10.4.81.21',
                ds_id: 2,
                ds_name: 'hive',
                ds_path: 'test',
                extract_type: 'standardExtraction',
                file_type: '',
                name: 'nei1',
                properties: [['name', 'string']],
                properties_index: ['name'],
                source_table: ['nei1'],
                source_type: 'automatic',
                task_id: 6,
                uniqueMarker: 1805,
                alias: ''
              }
            ],
            edges: []
          }
        ]
      })
    ).toStrictEqual({
      addEdges: [],
      copyEdgeId: 12,
      copyEntityId: 11,
      copySavedNodes: [
        {
          colour: '#C64F58',
          dataType: 'structured',
          data_source: 'hive',
          ds_address: '10.4.81.21',
          ds_id: 2,
          ds_name: 'hive',
          ds_path: 'test',
          entity_id: 10,
          extract_type: 'standardExtraction',
          file_type: '',
          index: undefined,
          model: '',
          name: 'nei1',
          properties: [['name', 'string']],
          properties_index: ['name'],
          source_table: ['nei1'],
          source_type: 'automatic',
          task_id: 6,
          alias: '',
          x: null,
          y: null
        }
      ]
    });
  });

  test('test function handleExternalImport', () => {
    expect(
      handleExternalImport({
        savedNodes: [],
        entity_id: 11,
        edge_id: 13,
        data: {
          edge: [],
          entity: [
            {
              colour: '#3A4673',
              dataType: '',
              data_source: '',
              ds_address: '',
              ds_id: '',
              ds_name: '',
              ds_path: '',
              entity_id: 1,
              extract_type: '',
              file_type: '',
              index: 0,
              model: '',
              name: '1',
              source_table: [],
              source_type: 'manual',
              task_id: '',
              alias: ''
            }
          ],
          id: 30,
          inPutType: 'entity',
          ontology_des: '',
          ontology_name: 'tt'
        }
      })
    ).toStrictEqual({
      edge_id: 13,
      edges: [],
      entity_id: 12,
      nodes: [
        {
          colour: '#3A4673',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          ds_path: '',
          entity_id: 11,
          extract_type: '',
          file_type: '',
          index: 0,
          model: '',
          name: '1',
          properties: undefined,
          properties_index: undefined,
          source_table: [],
          source_type: 'manual',
          task_id: '',
          alias: '',
          x: null,
          y: null
        }
      ]
    });
  });
});
