import React from 'react';
import { mount } from 'enzyme';
import BasicInfo from '.';
const mockGetSelection: any = jest.fn(() => {
  return {
    toString: jest.fn(() => {
      return 'mock selected text';
    }),
    removeAllRanges: jest.fn()
  };
});

window.getSelection = mockGetSelection;

const defaultProps = {
  selectedNode: {
    _cfg: '1',
    getModel: () => {
      return { _sourceData: { key: '111', value: 'aaa' } };
    }
  },
  onChangeDrawerKey: jest.fn(),
  summaryOpenInfo: ''
};

const init = (props = defaultProps) => mount(<BasicInfo {...props} />);

describe('explore/BasicInfo', () => {
  it('init', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
