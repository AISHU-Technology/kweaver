import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import NodeList from '../NodeList';

const defaultProps = {
  triggerSave: jest.fn()
};
const init = (props = defaultProps) => mount(<NodeList {...props} />);

describe('KnowledgeCard/BlockSource/NodeList', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
