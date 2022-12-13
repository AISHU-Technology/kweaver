import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import AnyShare from './index';

jest.mock('@/services/createEntity', () => ({
  getDataList: () =>
    Promise.resolve({
      res: {
        output: [
          {
            docid: '111',
            name: '222',
            type: 'dir'
          }
        ]
      }
    })
}));

const defaultProps = { selectedValue: {}, setSaveData: jest.fn() };
const init = (props = defaultProps) => mount(<AnyShare store={store} {...props} />);

describe('function test', () => {
  it('test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
