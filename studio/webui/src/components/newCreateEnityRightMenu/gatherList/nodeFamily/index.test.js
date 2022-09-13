import React from 'react';
import { shallow } from 'enzyme';
import NodeFamily from './index';

const props = {
  nodes: [
    {
      colour: '#BBD273',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 8,
      extract_type: '',
      file_type: '',
      index: 0,
      model: '',
      name: '1'
    },
    {
      colour: '#BBD273',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      ds_path: '',
      entity_id: 9,
      extract_type: '',
      file_type: '',
      index: 1,
      model: '',
      name: '2'
    }
  ],
  edges: [
    {
      colour: '#5F81D8',
      dataType: '',
      data_source: '',
      ds_address: '',
      ds_id: '',
      ds_name: '',
      edge_id: 11,
      end: 9,
      extract_type: '',
      file_type: '',
      index: 0,
      lineLength: 200,
      model: '',
      name: '1_2_2',
      shirft: 2,
      source: 0,
      source_table: [],
      source_type: 'manual',
      start: 8,
      target: 1,
      task_id: ''
    }
  ]
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NodeFamily />);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<NodeFamily {...props} />);
  const instance = wrapperShallow.instance();

  test('test function changeCheck', () => {
    wrapperShallow.setState({
      checkDelete: [1]
    });

    expect(
      instance.changeCheck(
        { target: { checked: true } },
        {
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
          index: 1
        }
      )
    ).toBe();

    expect(
      instance.changeCheck(
        { target: { checked: false } },
        {
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
          index: 1
        }
      )
    ).toBe();
  });

  test('test function isRepeatNode', () => {
    expect(
      instance.isRepeatNode(
        {
          colour: '#BBD273',
          dataType: '',
          data_source: '',
          ds_address: '',
          ds_id: '',
          ds_name: '',
          ds_path: '',
          entity_id: 8,
          extract_type: '',
          file_type: '',
          index: 0,
          model: '',
          name: '1'
        },
        0
      )
    ).toBe(false);
  });

  test('test function isInDelete', () => {
    expect(
      instance.isInDelete({
        colour: '#BBD273',
        dataType: '',
        data_source: '',
        ds_address: '',
        ds_id: '',
        ds_name: '',
        ds_path: '',
        entity_id: 8,
        extract_type: '',
        file_type: '',
        index: 0,
        model: '',
        name: '1'
      })
    ).toBe(false);
  });

  test('test function checkAllNode', () => {
    expect(instance.checkAllNode({ target: { checked: true } })).toBe();
    expect(instance.checkAllNode({ target: { checked: false } })).toBe();
  });

  test('test function deleteNode', () => {
    expect(instance.deleteNode([1])).toBe();
    expect(instance.deleteNode()).toBe();
  });
});
