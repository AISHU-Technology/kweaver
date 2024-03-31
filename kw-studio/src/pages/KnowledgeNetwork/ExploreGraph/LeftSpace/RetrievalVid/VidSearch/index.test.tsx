import React from 'react';
import { mount } from 'enzyme';
import VidSearch from '.';

const defaultProps = {
  classData: [],
  selectedItem: { graph: { current: { getNodes: jest.fn() } }, detail: { authorKgView: '111' } },
  searchConfig: [{}],
  leftDrawerKey: 'search',
  onCloseLeftDrawer: jest.fn(),
  onChangeData: jest.fn(),
  setSearchConfig: jest.fn()
};

const init = (props = defaultProps) => mount(<VidSearch {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
