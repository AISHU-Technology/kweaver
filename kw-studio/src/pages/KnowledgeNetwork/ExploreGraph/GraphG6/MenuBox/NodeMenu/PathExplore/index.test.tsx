import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import PathExplore from '.';
const defaultProps = {
  onCloseMenu: jest.fn(),
  onSetStartNode: jest.fn(),
  onChangeGraphMode: jest.fn(),
  onOpenLeftDrawer: jest.fn()
};
const init = (props = defaultProps) => mount(<PathExplore {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('click menu', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.pathItem').at(0).simulate('click');
    });
  });
  it('click more', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.more-op').at(0).simulate('click');
    });
  });
});
