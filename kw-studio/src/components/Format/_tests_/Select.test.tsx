import React from 'react';
import { shallow } from 'enzyme';

import Select from '../Select';

const init = (props: any) => shallow(<Select {...props} />);

describe('Select', () => {
  it('class name kw-format-select is exists', () => {
    const wrapper = init({});

    expect(wrapper.find('.kw-format-select').exists()).toBe(true);
  });
});
