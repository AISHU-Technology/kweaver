import React from 'react';
import { mount } from 'enzyme';
import ThesaurusModeCreate from '.';

const defaultProps = {
  isChange: false,
  setIsChange: jest.fn()
};

const init = (props = defaultProps) => mount(<ThesaurusModeCreate {...props} />);

describe('test', () => {
  it('test exist', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
