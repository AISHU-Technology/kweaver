import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ResizeDrawer from '.';

const defaultProps = {
  placement: 'bottom',
  children: null,
  title: '搜索结果',
  isOpen: true,
  height: 400,
  minHeight: 200, // 可拖拽的最低高度
  onClose: jest.fn()
};

const init = (props = defaultProps) => mount(<ResizeDrawer {...props} />);

describe('resizeDrawer', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });

  it('double click', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.drawerTitle').at(0).simulate('doubleclick');
    });
  });
});
