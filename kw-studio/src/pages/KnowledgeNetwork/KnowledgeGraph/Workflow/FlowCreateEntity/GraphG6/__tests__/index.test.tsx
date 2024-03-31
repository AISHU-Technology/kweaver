import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import GraphG6 from '../index';
import { mockGraph } from './mockData';

const defaultProps = {
  childRef: { current: undefined },
  current: 2,
  osId: 1,
  dbType: 'nebula',
  graphId: 1,
  ontoData: [
    {
      entity: mockGraph.nodes,
      edge: mockGraph.edges,
      id: 1,
      ontology_des: '',
      ontology_name: '',
      used_task: []
    }
  ],
  graphName: '图谱名称',
  ontologyId: 1,
  next: jest.fn(),
  prev: jest.fn()
};
const init = (props = defaultProps) => mount(<GraphG6 {...props} />);

describe('GraphG6', () => {
  it('test init', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
