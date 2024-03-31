import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ApiButton from '../components/ApiButton';

const defaultProps = {};
const init = (props = defaultProps) => mount(<ApiButton {...props} />);

describe('LLMModel/components/ApiButton', () => {
  it('test', async () => {
    const props = { className: 'test-btn', onClick: jest.fn() };
    const spyClick = jest.spyOn(props, 'onClick');
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
    act(() => {
      wrapper.find('.test-btn').first().simulate('click');
    });
    expect(spyClick).toHaveBeenCalled();
  });
});
