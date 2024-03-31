import React from 'react';
import { mount } from 'enzyme';
import { sleep, act } from '@/tests';
import SummaryInfo from '.';

const defaultProps = {
  selectedItem: {
    apis: {
      getGraphShapes: () => {
        return {
          nodes: [
            {
              getModel: () => {
                return {
                  _sourceData: {
                    uid: '1',
                    id: '1',
                    color: '#50A06A ',
                    default_property: { v: 'aa' },
                    icon: '',
                    alias: 'aa',
                    class: 'person',
                    showLabels: []
                  }
                };
              }
            }
          ],
          edges: [
            {
              getModel: () => {
                return {
                  _sourceData: {
                    uid: '2',
                    id: '2',
                    color: '#50A06A ',
                    default_property: { v: 'a' },
                    icon: '',
                    alias: 'a',
                    class: 'person',
                    showLabels: []
                  }
                };
              },
              getSource: jest.fn(),
              getTarget: jest.fn()
            }
          ]
        };
      }
    },
    graph: {
      current: {
        __isGroup: false,
        getNodes: () => {
          return [
            {
              getModel: () => {
                return {
                  _sourceData: {
                    uid: '1',
                    id: '1',
                    color: '#50A06A ',
                    default_property: { v: 'aa' },
                    icon: '',
                    alias: 'aa',
                    class: 'person',
                    showLabels: []
                  }
                };
              }
            }
          ];
        },
        getEdges: () => {
          return [
            {
              getModel: () => {
                return {
                  _sourceData: {
                    uid: '2',
                    id: '2',
                    color: '#50A06A ',
                    default_property: { v: 'a' },
                    icon: '',
                    alias: 'a',
                    class: 'person',
                    showLabels: []
                  }
                };
              },
              getSource: jest.fn(),
              getTarget: jest.fn()
            }
          ];
        },
        findById: jest.fn()
      }
    }
  },
  summaryOpenInfo: { openInfo: false, infoId: '' },
  onCloseRightDrawer: jest.fn(),
  onChangeData: jest.fn(),
  onOpenRightDrawer: jest.fn()
};
const init = (props = defaultProps) => mount(<SummaryInfo {...props} />);

describe('exploreGraph/summaryInfo', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('search', () => {
    const wrapper = init();
    act(() => {
      wrapper
        .find('.ant-input')
        .at(0)
        .simulate('change', { target: { value: 'a' } });
    });
  });
  it('change type', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.right-border').at(0).simulate('click');
    });
  });
  it('onClickClass ', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-collapse-header').at(0).simulate('click');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.anticon').last().simulate('click');
    });
  });
});
