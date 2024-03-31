import React from 'react';
import { shallow } from 'enzyme';
import SlicedBar from '../SlicedBar';

describe('SlicedBar', () => {
  const props = {
    selectedItem: {},
    disabled: {},
    onOpenLeftDrawer: () => {},
    onChangeData: () => {}
  };

  it('SlicedBar have class', () => {
    const app = shallow(<SlicedBar {...props} />);
    expect(app.find('.leftSpaceSimpleRoot').exists()).toBe(true);
  });
});
