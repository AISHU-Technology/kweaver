import React from 'react';
import { shallow } from 'enzyme';
import SimpleLayout from './index';

describe('SimpleLayout', () => {
  const props = {
    selectedItem: {},
    onChangeData: () => {},
    onCloseLeftDrawer: () => {}
  };

  it('SimpleLayout have class', () => {
    const app = shallow(<SimpleLayout {...props} />);
    expect(app.find('.simpleLayoutChangeRoot').exists()).toBe(true);
  });
});
