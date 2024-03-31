import React from 'react';
import { mount } from 'enzyme';
import NeighborQuery from '.';
import { sleep } from '@/tests';
import { act } from 'react-test-renderer';

const defaultProps = {
  classData: [],
  isLayoutTree: false,
  selectedItem: {
    graph: {
      current: {
        getNodes: () => {
          return [
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
          ];
        },
        findById: jest.fn(),
        getEdges: () => {
          return [
            {
              getModel: () => {
                return { _sourceData: { id: '2', default_property: { v: 'aab' } } };
              }
            }
          ];
        }
      }
    },
    detail: { authorKgView: '111', kg: { kg_id: '11' } },
    selected: {
      nodes: [
        {
          getModel: () => {
            return { _sourceData: { id: '1', default_property: { v: 'aa' } } };
          },
          getOutEdges: () => {
            return [{ getTarget: () => 'qwe', _cfg: { model: { _sourceData: { class: 'aa' } } } }];
          }
        },
        {
          getModel: () => {
            return { _sourceData: { id: '2', default_property: { v: 'aab' } } };
          },
          getOutEdges: () => {
            return [{ getTarget: () => 'qwe', _cfg: { model: { _sourceData: { class: 'aa' } } } }];
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
                return { _sourceData: { id: '1', default_property: { v: 'aa' } } };
              }
            },
            {
              getModel: () => {
                return { _sourceData: { id: '2', default_property: { v: 'aab' } } };
              }
            }
          ]
        };
      }
    }
  },
  leftDrawerKey: 'neighbors',
  onCloseLeftDrawer: jest.fn(),
  onChangeData: jest.fn(),
  setSelectNodes: jest.fn(),
  onCloseRightDrawer: jest.fn()
};

jest.mock('@/services/explore', () => ({
  getNeighbors: () =>
    Promise.resolve({
      res: {
        nodes_count: 1,
        edges_count: 1,
        nodes: [
          {
            id: '47b076af96cae488401b07c31ec885ec',
            alias: '企业',
            color: '#5889C4',
            class_name: 'enterprise',
            icon: '',
            default_property: {
              name: 'name',
              value: '江苏新海石化有限公司',
              alias: '企业名称'
            },
            tags: ['enterprise'],
            properties: [
              {
                tag: 'enterprise',
                props: [
                  {
                    name: 'listed_exchange',
                    value: '',
                    alias: '上市交易所',
                    type: 'string',
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
            id: 'information_2_enterprise:028bc4ce4b323d475f4ffef432bd873a-47b076af96cae488401b07c31ec885ec',
            alias: '关于',
            color: '#5F81D8',
            class_name: 'information_2_enterprise',
            source: '028bc4ce4b323d475f4ffef432bd873a',
            target: '47b076af96cae488401b07c31ec885ec',
            properties: []
          }
        ]
      }
    })
}));
const init = (props = defaultProps) => mount(<NeighborQuery {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('test search', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
  });

  it('search canvas', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
  });
});
