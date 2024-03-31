import React from 'react';
import { mount } from 'enzyme';
import Glossary from '../index';

const init = (props: any) => mount(<Glossary {...props} />);

describe('GlossaryPage', () => {
  it('GlossaryPage is exists', () => {
    const props = {
      knData: {},
      onChangePageSign: () => {},
      handleChangeSelectKn: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
