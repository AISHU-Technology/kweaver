import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ExploreLoadTip from '.';

const init = (props = {}) => mount(<ExploreLoadTip {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init({ cancelOperation: jest.fn() });
    expect(wrapper.exists()).toBe(true);
  });

  it('cancel', () => {
    const wrapper = init({ cancelOperation: jest.fn() });
    act(() => {
      wrapper.find('.kw-pointer').at(0).simulate('click');
    });
  });
});
