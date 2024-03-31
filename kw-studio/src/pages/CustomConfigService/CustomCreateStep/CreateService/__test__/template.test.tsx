import React from 'react';
import { mount } from 'enzyme';
import Template from '../Template';
import templateJson from '../../../template.json';

const defaultProps = {
  onAddTemplate: jest.fn(),
  templateData: templateJson
};

const init = (props = defaultProps) => mount(<Template {...props} />);

describe('test UI', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
