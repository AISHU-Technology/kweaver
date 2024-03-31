import React from 'react';
import { shallow } from 'enzyme';
import GraphG6 from './index';

describe('GraphG6', () => {
  const props = {
    selectedItem: {},
    configMenu: {},
    onChangeData: () => {},
    onTriggerLoading: () => {},
    onOpenLeftDrawer: () => {},
    onOpenRightDrawer: () => {},
    onCloseRightDrawer: () => {}
  };

  it('GraphG6 have class', () => {
    const app = shallow(<GraphG6 {...props} />);
    expect(app.find('.graphG6Root').exists()).toBe(true);
  });
});
