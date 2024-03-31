import React from 'react';
import { mount } from 'enzyme';

import IndexesList from '../GraphInfo/ConfigurationDetails/IndexesList';

const init = (props: any) => mount(<IndexesList {...props} />);

describe('IndexesList', () => {
  const props = { items: [{ name: 'test', type: 'string', properties: ['name', 'age'] }] };
  it('have text // Indexes', () => {
    const wrapper = init(props);
    expect(wrapper.find('.indexes').children()).toHaveLength(2);
  });
  it('imitationInput have 3 children', () => {
    const wrapper = init(props);
    expect(wrapper.find('.imitationInput').at(0).children()).toHaveLength(3);
  });
});
