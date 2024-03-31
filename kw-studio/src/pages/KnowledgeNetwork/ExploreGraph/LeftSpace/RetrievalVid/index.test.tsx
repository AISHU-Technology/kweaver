import React from 'react';
import { shallow } from 'enzyme';
import RetrievalVid from '.';

const defaultProps = {
  classData: [],
  leftDrawerKey: 'search',
  selectedItem: {},
  isLayoutTree: false,
  onCloseLeftDrawer: jest.fn(),
  onChangeData: jest.fn()
};
const init = (props = defaultProps) => shallow(<RetrievalVid {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
