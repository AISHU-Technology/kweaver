import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import CustomCreateStep from '../index';
import { knData } from '../../../mockData';
import templateJson from '../../../template.json';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';

const defaultProps = {
  knwData: knData,
  knwStudio: '',
  setKnwStudio: jest.fn()
};

jest.mock('@/services/cognitiveSearch', () => ({
  getKgList: jest.fn(() => Promise.resolve({ res: { count: 0, df: [] } }))
}));

jest.mock('@/services/customService', () => ({
  checkValidity: jest.fn(() =>
    Promise.resolve({
      res: 'ok'
    })
  )
}));

const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <CustomCreateStep {...props} />
    </Provider>
  );

describe('test UI', () => {
  it('test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
