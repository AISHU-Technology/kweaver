import React from 'react';
import IntentionSelect from '../IntentionSelect';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  intentionList: [],
  testData: {
    props: {
      full_text: { search_config: [], switch: false, oldSwitch: false },
      data_source_scope: []
    }
  },
  setIntentionList: jest.fn(),
  setIntentId: jest.fn(),
  setLoading: jest.fn(),
  operateFail: false
};
const init = (props = defaultProps) => mount(<IntentionSelect {...props} />);

describe('test UI', () => {
  it('UI test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('Function test', () => {
  it('test click', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Select').at(0).simulate('click');
    });
  });
});
