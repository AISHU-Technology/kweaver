import React from 'react';
import { mount } from 'enzyme';

import TimePickerSetting from '.';

export type TimePickerSettingType = {
  arFileSave: any;
  selectedKey: any;
  setArFileSave: (data: any) => void;
  onSetTimeToPreview: (data: any) => void;
  editData: any;
  type?: any;
};

const defaultProp: TimePickerSettingType = {
  arFileSave: {},
  selectedKey: '',
  setArFileSave: jest.fn(),
  onSetTimeToPreview: jest.fn(),
  editData: {},
  type: 'four'
};

const init = (props = defaultProp) => mount(<TimePickerSetting {...props} />);

describe('test UI', () => {
  it('test exist', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
