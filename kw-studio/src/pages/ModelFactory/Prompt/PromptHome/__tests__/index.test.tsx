import React from 'react';
import { shallow } from 'enzyme';
import PromptHome from '../index';

const defaultProps = {};
const init = (props = defaultProps) => shallow(<PromptHome {...props} />);

describe('PromptHome', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
