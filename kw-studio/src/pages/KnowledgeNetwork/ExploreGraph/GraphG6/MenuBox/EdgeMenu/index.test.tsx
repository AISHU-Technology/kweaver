import React from 'react';
import { shallow } from 'enzyme';

import EdgeContextMenu from '.';
const defaultProps = {
  selectedItem: { graph: { current: { __isGroup: true, __getSubGroups: jest.fn() } }, detail: { authorKgView: true } },
  selectedNode: {
    hasLocked: () => false,
    getModel: () => {
      return {
        size: 32,
        id: '111',
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
const init = (props = defaultProps) => shallow(<EdgeContextMenu {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
