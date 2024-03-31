import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

import store from '@/reduxConfig/store';
import ExploreGraph from '..';

const defaultProps = { onChangeHasUnsaved: jest.fn(), ad_sqlHistory: {}, ad_updateSqlHistory: jest.fn() };
const init = (props = defaultProps) =>
  shallow(
    <Provider store={store}>
      <ExploreGraph {...props} />
    </Provider>
  );

describe('render exploreGraph', () => {
  it('init', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
