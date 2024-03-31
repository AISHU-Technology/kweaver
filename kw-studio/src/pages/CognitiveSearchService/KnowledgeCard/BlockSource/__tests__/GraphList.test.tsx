import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import GraphList from '../GraphList';

const init = () => mount(<GraphList />);

describe('KnowledgeCard/BlockSource/GraphList', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
