import React from 'react';
import { mount } from 'enzyme';
import Labels from './index';
import { act } from 'react-test-renderer';
import { sleep } from '@/tests';

const defaultProps = {
  tags: ['11'],
  selectOption: ['22', '44', '66'],
  setTags: jest.fn()
};
const init = (props = defaultProps) => mount(<Labels {...props} />);

describe('Labels', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('function', () => {
  it('click', async () => {
    const wrapper = init();

    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-tag').at(1).simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ad-pl-3.ad-pr-3.select-item.ad-ellipsis').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ant-tag').length).toBe(2);
  });
  it('delete tag', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-tag-close-icon').at(0).simulate('click');
    });
  });
});
