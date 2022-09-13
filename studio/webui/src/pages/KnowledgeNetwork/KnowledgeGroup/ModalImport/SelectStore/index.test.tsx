import React from 'react';
import { mount } from 'enzyme';

import SelectStore from './index';

const init = (props: any) => mount(<SelectStore {...props} />);

describe('SelectStore', () => {
  test('class selectRoot is exists', () => {
    const data = { placeholder: '', value: '', onChange: () => {} };
    const wrapper = init(data);
    expect(wrapper.find('.selectRoot').exists()).toBe(true);
  });
});
