import React from 'react';
import ResourceDrop from './index';
import { shallow } from 'enzyme';

const defaultProps = { knwList: [], filters: {}, onChangeResource: jest.fn() };
const init = (props = defaultProps) => shallow(<ResourceDrop {...props} />);

describe('test UI is render', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
