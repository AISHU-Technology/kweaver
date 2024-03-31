import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import CanvasMenu from '.';

const defaultProps = {
  selectedItem: {},
  onClickCanvasMenu: jest.fn()
};

const init = (props = defaultProps) => mount(<CanvasMenu {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('bottom test', () => {
  it('ok test', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-menu-item').at(0).simulate('click');
    });
    await sleep();
  });
});
