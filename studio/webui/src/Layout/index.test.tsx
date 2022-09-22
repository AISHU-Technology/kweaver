import React from 'react';
import { shallow } from 'enzyme';
import Layout from './index';

const defaultProps = {
  header: {},
  sidebar: {},
  mainStyle: {},
  isHeaderHide: false,
  children: <div />
};
const init = (props = defaultProps) => shallow(<Layout {...props} />);

describe('Layout', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
