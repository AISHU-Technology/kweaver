import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';
import HistoryModel from '.';
import { sleep } from '@/tests';

const defaultProps = {
  visible: false,
  sqlKey: 'aaa',
  selectedItem: { key: 'aaa' },
  sqlHistory: { aaa: [1111, 2222] },
  onClose: jest.fn()
};

const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <HistoryModel {...props} />
    </Provider>
  );

describe('history', () => {
  it('init', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('delete', () => {
  it('clear', async () => {
    const wrapper = init();
    await sleep(100);
    wrapper.update();
  });
});
