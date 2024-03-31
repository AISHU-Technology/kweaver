import React from 'react';
import { shallow } from 'enzyme';
import ModelSetting from '../ModelSetting';

describe('ModelSetting', () => {
  const props = {
    graphConfig: {},
    onChangeData: () => {}
  };

  it('ModelSetting have class', () => {
    const app = shallow(<ModelSetting {...props} />);
    expect(app.find('.modelSettingRoot').exists()).toBe(true);
  });
});
