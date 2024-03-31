import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import BlockPreview from './index';

const defaultProps = {};
const init = (props = defaultProps) => mount(<BlockPreview {...props} />);

describe('BlockPreview', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
