import React from 'react';
import { mount } from 'enzyme';
import { knData } from '../../../mockData';
import Publish from '../index';

import { ANALYSIS_SERVICES } from '@/enums';
const { ACCESS_METHOD, PERMISSION } = ANALYSIS_SERVICES;

export type PublishType = {
  onPrev: () => void;
  basicData: {};
  setIsPrevent: () => void;
  actuatorData: {};
};

const defaultProps = {
  onPrev: jest.fn(),
  basicData: {
    operation_type: 'custom-search',
    permission: PERMISSION.APPID_LOGIN,
    access_method: [ACCESS_METHOD.REST_API],
    knw_id: knData?.id,
    knw_name: knData?.knw_name,
    id: '1',
    kg_id: 0
  },
  setIsPrevent: jest.fn(),
  actuatorData: {},
  isSaved: false,
  setIsSaved: jest.fn()
};

const init = (props = defaultProps) => mount(<Publish {...props} />);

describe('test UI', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
