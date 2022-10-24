import React from 'react';
import { mount } from 'enzyme';

import store from '@/reduxConfig/store';
import Menus from '../index';

const init = (props: any) => mount(<Menus {...props} store={store} />);

describe('Menus', () => {
  const props = {
    ad_graphStatus: '',
    selectedData: {},
    graphid: 10,
    graphData: {},
    graphCount: {},
    graphBasicData: {},
    onRefresh: () => {}
  };
  it('infoList have 5 children', () => {
    const wrapper = init(props);
    expect(wrapper.find('.infoList').children()).toHaveLength(5);
  });
  it('infoDrawer have 1 children', () => {
    const wrapper = init(props);
    if (wrapper.find('.infoDrawer').hasClass('infoDrawerOpen')) {
      expect(wrapper.find('.infoDrawer').children()).toHaveLength(1);
    }
  });
});
