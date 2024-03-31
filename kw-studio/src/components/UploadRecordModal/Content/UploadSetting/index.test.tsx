import React from 'react';
import { mount } from 'enzyme';

import UploadSetting from '.';

const init = (props = { tabsKey: 'setting' }) => mount(<UploadSetting {...props} />);

describe('uploadingSetting', () => {
  it('init', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
