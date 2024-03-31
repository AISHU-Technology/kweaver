import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';

import ExploreAnalysis from '.';

const defaultProps = { selectedGraph: { kgconfid: 1, id: 1 } };
const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <ExploreAnalysis {...props} />
    </Provider>
  );

describe('exploreAnalysis', () => {
  it('init wrapper', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
