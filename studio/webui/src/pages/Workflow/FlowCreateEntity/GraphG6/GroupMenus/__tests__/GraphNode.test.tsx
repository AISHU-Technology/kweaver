import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import GraphNode from '../GroupTree/GraphNode';
import { mockGraph } from '../../__tests__/mockData';

const defaultProps = {
  data: {},
  type: 'entity'
} as const;
const init = (props = defaultProps) => mount(<GraphNode {...props} />);

describe('GroupMenus/GroupTree/GraphNode', () => {
  it('test render', () => {
    const wrapper = init();
    wrapper.setProps({
      type: 'entity',
      data: mockGraph.nodes[0]
    });
    wrapper.setProps({
      type: 'edge',
      data: mockGraph.edges[0]
    });
    expect(wrapper.exists()).toBe(true);
  });
});
