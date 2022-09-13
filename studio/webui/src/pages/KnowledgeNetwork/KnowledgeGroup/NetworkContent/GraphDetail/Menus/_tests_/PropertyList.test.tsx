import React from 'react';
import { mount } from 'enzyme';

import PropertyList from '../GraphInfo/ConfigurationDetails/PropertyList';

const init = (props: any) => mount(<PropertyList {...props} />);

describe('PropertyList', () => {
  it('imitationInput is exists', () => {
    const props = { items: [{ name: 'test', type: 'string' }] };
    const wrapper = init(props);

    expect(wrapper.find('.imitationInput').exists()).toBe(true);
  });
});
