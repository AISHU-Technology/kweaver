import React from 'react';
import { mount } from 'enzyme';
import PreviewCanvas, { parseModelGraph } from '../PreviewCanvas';
import { mockModelGraph } from './mockData';

const defaultProps = {
  graphData: { nodes: [], edges: [] }
};
const init = (props = defaultProps) => mount(<PreviewCanvas {...props} />);

describe('Preview/PreviewCanvas', () => {
  it('test render', async () => {
    const wrapper = init();
    // wrapper.setProps({ graphData: parseModelGraph(mockModelGraph) });
    expect(wrapper.exists()).toBe(true);
  });
});
