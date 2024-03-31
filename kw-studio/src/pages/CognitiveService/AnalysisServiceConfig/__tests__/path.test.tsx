import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import Paths from '../ConfigAndTest/Path';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';

const defaultProps = {
  action: 'create' as const,
  basicData: {} as any,
  testData: {} as any,
  ontoData: { edge: [], entity: [] },
  onChange: jest.fn(),
  onPrev: jest.fn(),
  onNext: jest.fn(),
  setIsSaved: jest.fn()
};
const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <Paths {...props} />
    </Provider>
  );

describe('AnalysisServiceConfig/ConfigAndTest/Path', () => {
  it('test', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});
