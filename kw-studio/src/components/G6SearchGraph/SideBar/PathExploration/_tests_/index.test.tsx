import React from 'react';
import { shallow } from 'enzyme';
import { act, sleep } from '@/tests';
import PathExplore from '../index';

const props: any = {
  startNode: {}, // 起点
  endNode: {}, // 终点
  nodes: [],
  selectedNode: {},
  lefSelect: 1,
  sideBarVisible: false,
  selectGraph: {},
  edges: [],
  pathList: [],
  direction: 'positive',
  pathType: 1,
  isExplorePath: false,
  addGraphData: jest.fn(),
  setStartNode: jest.fn(), // 设置起点
  setEndNode: jest.fn(), // 设置终点
  setPathList: jest.fn(),
  setDirection: jest.fn(),
  setType: jest.fn(),
  setSelectedPath: jest.fn(),
  setIsExplorePath: jest.fn()
};

describe('PathExplore', () => {
  it('render', async () => {
    const wrapper = shallow(<PathExplore {...props} />);
    expect(wrapper.exists());
  });
});
