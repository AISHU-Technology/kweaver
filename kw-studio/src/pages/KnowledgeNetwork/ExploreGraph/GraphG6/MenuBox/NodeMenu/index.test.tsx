import React from 'react';
import { shallow } from 'enzyme';
import NodeMenu from '.';
const defaultProps = {
  selectedItem: {
    graph: { current: { __isGroup: true, __getSubGroups: jest.fn() } },
    detail: { authorKgView: true, kg: { kg_id: '12' } }
  },
  selectedNode: {
    color: '#019688',
    hasLocked: () => false,
    getModel: () => {
      return {
        id: '111',
        size: 32,
        _sourceData: {
          color: '#019688',
          isGrey: false,
          showLabels: [
            { key: '#id', value: '1111', isChecked: false, isDisabled: false },
            { key: 'pro', value: 'aaa', isChecked: false, isDisabled: false }
          ]
        }
      };
    },
    get: jest.fn()
  }
};
const init = (props = defaultProps) => shallow(<NodeMenu {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
