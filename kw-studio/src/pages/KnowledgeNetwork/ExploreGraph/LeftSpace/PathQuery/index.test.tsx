import React from 'react';
import { mount } from 'enzyme';
import PathQuery from '.';
import { act, sleep } from '@/tests';

const defaultProps = {
  classData: [],
  selectedItem: {
    graph: { current: { getNodes: jest.fn(), findById: jest.fn(), getEdges: jest.fn() } },
    detail: { authorKgView: '111', kg: { kg_id: '11' } },
    selected: {
      nodes: [
        {
          getModel: () => {
            return { _sourceData: { id: '1', default_property: { v: 'aa' } } };
          }
        },
        {
          getModel: () => {
            return { _sourceData: { id: '2', default_property: { v: 'aab' } } };
          }
        }
      ]
    },
    apis: {
      getGraphShapes: () => {
        return {
          nodes: [
            {
              getModel: () => {
                return { _sourceData: { id: '190', default_property: { v: 'aa' } } };
              }
            },
            {
              getModel: () => {
                return { _sourceData: { id: '682', default_property: { v: 'aab' } } };
              }
            }
          ]
        };
      }
    },
    rules: {
      paths: [
        {
          name: '2',
          searchRules: {
            e_filters: [
              {
                id: 'tag4',
                relation: 'and',
                type: 'satisfy_all',
                error: false,
                dataSource: {
                  alias: '包含',
                  color: '#7BBAA0',
                  edge_id: 1,
                  name: 'technique_2_reaction',
                  properties: [],
                  relation: ['technique', 'technique_2_reaction', 'reaction']
                },
                property_filters: [],
                selfProperties: [],
                edge_class: 'technique_2_reaction'
              }
            ]
          },
          error: false
        }
      ]
    }
  },
  leftDrawerKey: 'path',
  onCloseLeftDrawer: jest.fn(),
  onChangeData: jest.fn(),
  setSelectNodes: jest.fn(),
  onCloseRightDrawer: jest.fn()
};

jest.mock('@/services/explore', () => ({
  explorePath: () =>
    Promise.resolve({
      res: {
        nodes: [
          {
            id: 'a572ac27a0b7040736431a05badfa6c0',
            alias: '文档',
            color: '#ED679F',
            class_name: 'document',
            icon: 'icon1',
            default_property: {
              name: 'name',
              value: '地理.ppt',
              alias: '名称'
            },
            tags: ['document'],
            properties: [
              {
                tag: 'document',
                props: [
                  {
                    name: 'path',
                    value: '自定义文档库2/test_zl/地理.ppt',
                    alias: '路径',
                    type: 'string',
                    disabled: false,
                    checked: false
                  }
                ]
              }
            ]
          },
          {
            id: '7084df4c4210dcd8e29052ae2f6e531c',
            alias: 'label1',
            color: '#8BC34A',
            class_name: 'label',
            icon: 'icon2',
            default_property: {
              name: 'name',
              value: '课题',
              alias: '名称'
            },
            tags: ['label'],
            properties: [
              {
                tag: 'label',
                props: [
                  {
                    name: 'type_nw',
                    value: '__NULL__',
                    alias: '是否来自新词',
                    type: 'null',
                    disabled: false,
                    checked: false
                  }
                ]
              }
            ]
          }
        ],
        edges: [
          {
            id: 'label2document:7084df4c4210dcd8e29052ae2f6e531c-a572ac27a0b7040736431a05badfa6c0',
            alias: 'label2document',
            color: '#374047',
            class_name: 'label2document',
            source: '7084df4c4210dcd8e29052ae2f6e531c',
            target: 'a572ac27a0b7040736431a05badfa6c0',
            properties: [
              {
                name: 'weight',
                value: '__NULL__',
                alias: '权重',
                type: 'null',
                disabled: false,
                checked: false
              },
              {
                name: 'name',
                value: 'label2document',
                alias: '名称',
                type: 'string',
                disabled: false,
                checked: false
              }
            ]
          }
        ],
        paths: [
          {
            nodes: ['7084df4c4210dcd8e29052ae2f6e531c', 'a572ac27a0b7040736431a05badfa6c0'],
            edges: ['label2document:7084df4c4210dcd8e29052ae2f6e531c-a572ac27a0b7040736431a05badfa6c0']
          }
        ]
      }
    })
}));
const init = (props = defaultProps) => mount(<PathQuery {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('test search', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.anticon.kw-pointer.kw-pt-3').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-input-number-input').at(0).simulate('change', 6);
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
  });

  it('search canvas', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-select-selector').at(2).simulate('mousedown');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    wrapper.update();
  });
});
