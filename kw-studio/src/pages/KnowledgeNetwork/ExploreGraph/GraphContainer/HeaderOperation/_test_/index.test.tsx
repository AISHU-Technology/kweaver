import React from 'react';
import { shallow } from 'enzyme';
import HeaderOperation from '../index';

describe('HeaderOperation', () => {
  const props = {
    configSearch: {},
    configOperate: {},
    selectedItem: {},
    onChangeData: () => {},
    onOpenLeftDrawer: () => {},
    onOpenRightDrawer: () => {},
    onCloseRightDrawer: () => {},
    onOpenSaveModal: () => {}
  };

  it('HeaderOperation have class', () => {
    const app = shallow(<HeaderOperation {...props} />);
    expect(app.find('.headerOperationRoot').exists()).toBe(true);
  });
});
