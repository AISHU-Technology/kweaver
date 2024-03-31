import React from 'react';
import { mount } from 'enzyme';
import TopSteps from './index';

const defaultProps = { step: 0 };
const init = (props = defaultProps) => mount(<TopSteps {...props} />);

describe('TopSteps', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
