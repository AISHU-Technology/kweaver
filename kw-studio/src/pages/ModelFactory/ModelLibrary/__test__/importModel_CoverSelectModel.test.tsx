import React from 'react';
import { mount } from 'enzyme';
import CoverSelectModel from '../ImportModel/CoverSelectModel';

const init = (props: any) => mount(<CoverSelectModel {...props} />);

describe('CoverSelectModel', () => {
  it('component is exists', () => {
    const wrapper = init({
      form: {},
      knData: {},
      onChange: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
