import React from 'react';
import QuerySettingModal from '..';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  radioOpen: true,
  testData: {
    props: {
      full_text: { search_config: [], switch: false, oldSwitch: false },
      data_source_scope: []
    }
  },
  intentId: 0,
  setIntentId: jest.fn(),
  saveRef: {},
  operateFail: false
};
const init = (props = defaultProps) => mount(<QuerySettingModal {...props} />);

describe('test UI', () => {
  it('UI test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
