import React from 'react';
import { mount } from 'enzyme';
import Tags from './index';
import { act } from 'react-test-renderer';
import { sleep } from '@/tests';

const defaultProps = {
  value: ['11'],
  selectOption: ['22', '44', '66'],
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<Tags {...props} />);

describe('tags', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('function', () => {
  it('click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.addTagButton').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.tagInput').length).toBe(3);

    act(() => {
      wrapper.find('.selectItem').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.addTagButton').at(0).simulate('click');
    });

    act(() => {
      wrapper.find('.ant-tag-close-icon').at(0).simulate('click');
    });
  });
});
