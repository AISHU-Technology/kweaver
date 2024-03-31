import React from 'react';
import { mount } from 'enzyme';
import MoreInfo from '../components/MoreInfo';

const defaultProps = {};
const init = (props = defaultProps) => mount(<MoreInfo {...props} />);

describe('PromptConfig/components/MoreInfo', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    const wrapper2 = init({
      data: {
        id: '555',
        status: '',
        role: 'ai',
        message: '55555',
        timestamp: '4444',
        token_len: 5,
        time: 123456
      }
    });
    expect(wrapper2.exists()).toBe(true);
  });
});
