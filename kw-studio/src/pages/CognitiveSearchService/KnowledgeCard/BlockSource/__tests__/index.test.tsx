import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import BlockSource from '../index';

const defaultProps = {
  triggerSave: jest.fn(() => [])
};
const init = (props = defaultProps) => mount(<BlockSource {...props} />);

describe('BlockSource', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
