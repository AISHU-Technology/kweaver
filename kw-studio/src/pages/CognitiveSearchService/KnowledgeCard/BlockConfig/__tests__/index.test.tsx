import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import BlockConfig from '../index';

const defaultProps = {
  onViewOntology: jest.fn()
};
const init = (props = defaultProps) => mount(<BlockConfig {...props} />);

describe('BlockConfig', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
