import React from 'react';
import { shallow } from 'enzyme';
import HeaderTabs from './index';

describe('HeaderTabs', () => {
  const props = {
    selectedItem: {},
    activeKey: '1',
    graphItems: [{ newTabData: {} }],
    leftDrawerKey: 'left',
    onChangeData: () => {},
    onOpenLeftDrawer: () => {},
    onCloseLeftDrawer: () => {},
    onOpenRightDrawer: () => {},
    onCloseRightDrawer: () => {},
    onOpenSaveModal: () => {},
    onChangeActive: () => {},
    onChangeHasUnsaved: () => {},
    onChangeGraphItems: () => {},
    clearHistory: () => {}
  };

  it('HeaderTabs have class', () => {
    const app = shallow(<HeaderTabs {...props} />);
    expect(app.exists()).toBe(true);
  });
});
