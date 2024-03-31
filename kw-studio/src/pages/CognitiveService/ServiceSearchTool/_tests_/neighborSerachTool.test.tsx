import React from 'react';
import { mount } from 'enzyme';
import NeighborSearchTool from '../NeighborSearchTool';

const dProps = {
  data: {},
  hideExpandIcon: '',
  canvasInstance: {}
};

const init = (props = dProps) => mount(<NeighborSearchTool {...props} />);

describe('init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
