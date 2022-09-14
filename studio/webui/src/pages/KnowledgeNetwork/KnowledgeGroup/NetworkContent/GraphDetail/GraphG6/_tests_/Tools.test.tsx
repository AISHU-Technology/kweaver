import React from 'react';
import { shallow } from 'enzyme';

import Tools from '../Tools/index';

const init = (props: any) => shallow(<Tools {...props} />);

describe('Tools', () => {
  const props = { graph: {}, graphContainer: {} };

  it('Tools have 4 children', async () => {
    const wrapper = init(props);

    expect(wrapper.find('.toolsRoot').children()).toHaveLength(3);
  });

  it('reduce is exists', async () => {
    const wrapper = init(props);

    expect(wrapper.find('.reduce').exists()).toBe(true);
  });
});
