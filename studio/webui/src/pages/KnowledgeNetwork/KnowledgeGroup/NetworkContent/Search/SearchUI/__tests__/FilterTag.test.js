import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import { mockTags } from './mockData';
import FilterTag from '../FilterTag';

const init = (props = {}) => mount(<FilterTag {...props} />);

describe('SearchUI/FilterTag', () => {
  it('test render', async () => {
    const props = {
      className: 'test',
      index: 0,
      data: mockTags[0],
      onDelete: jest.fn()
    };
    const wrapper = init(props);
    const spyDelete = jest.spyOn(props, 'onDelete');

    expect(wrapper.hasClass(props.className)).toBe(true);
    act(() => {
      wrapper.find('.close-wrap').at(0).simulate('click');
    });
    expect(spyDelete).toHaveBeenCalled();

    mockTags.forEach(tag => {
      wrapper.setProps({ data: tag });
      expect(wrapper.find('.tag-name').text().includes(tag.pro)).toBe(true);
    });
  });
});
