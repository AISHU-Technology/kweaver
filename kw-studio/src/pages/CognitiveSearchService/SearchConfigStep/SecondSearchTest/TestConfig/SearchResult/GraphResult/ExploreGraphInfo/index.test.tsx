import React from 'react';
import { shallow } from 'enzyme';
import ExploreGraphInfo from './index';

const defaultProps: any = { graphId: 1, subgraph: {} };
const init = (props = defaultProps) => shallow(<ExploreGraphInfo {...props} />);

describe('ExploreGraphInfo', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
