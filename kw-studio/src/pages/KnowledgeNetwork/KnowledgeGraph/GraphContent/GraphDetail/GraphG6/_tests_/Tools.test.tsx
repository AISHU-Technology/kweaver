import React from 'react';
import { mount } from 'enzyme';

import Tools from '../Tools/index';

const init = (props: any) => mount(<Tools {...props} />);

describe('Tools', () => {
  const props = { graph: {}, graphContainer: {} };

  it('Tools have 4 children', async () => {
    const wrapper = init(props);

    expect(wrapper.find('.toolsRoot').children()).toHaveLength(5);
  });

  it('btn is exists', async () => {
    const wrapper = init(props);
    expect(wrapper.find('.kw-btn-icon')).toHaveLength(3);
  });
});
