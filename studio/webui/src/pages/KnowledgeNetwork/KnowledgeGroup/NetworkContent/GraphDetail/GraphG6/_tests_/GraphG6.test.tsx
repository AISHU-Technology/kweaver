import React from 'react';
import { shallow } from 'enzyme';

import GraphG6 from '../index';

const PROPS = {
  graphData: {},
  onChangeData: {}
};

describe('GraphG6', () => {
  const wrapper = shallow(<GraphG6 {...PROPS} />);

  it('graphContainer is exists', async () => {
    expect(wrapper.find('.graphContainer').exists()).toBe(true);
  });
});
