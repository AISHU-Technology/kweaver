import React from 'react';
import { shallow } from 'enzyme';
import PathList from '../PathList';
const props: any = {
  nodes: {},
  pathList: [],
  direction: 'bidirect',
  loading: false,
  pathType: 1,
  setSelectedPath: jest.fn(),
  setPathList: jest.fn(),
  startExplore: jest.fn(),
  setDirection: jest.fn()
};

describe('PathList', () => {
  it('render', async () => {
    const wrapper = shallow(<PathList {...props} />);
    expect(wrapper.exists());
  });
});
