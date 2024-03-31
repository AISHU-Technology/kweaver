import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

import store from '@/reduxConfig/store';
import ModalLanguage from './index';

const props = { visible: true, onClose: jest.fn() };
const init = (props: any) =>
  shallow(
    <Provider store={store}>
      <ModalLanguage {...props} />
    </Provider>
  );

describe('change language', () => {
  it('should render', () => {
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
