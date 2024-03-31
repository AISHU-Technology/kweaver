import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import Footer from './index';
import { mockGraph, mockGroupList } from '../__tests__/mockData';

jest.mock('@/services/createEntity', () => ({
  changeFlowData: jest.fn(() => Promise.resolve({ res: 'success' }))
}));
jest.mock('@/services/subGraph', () => ({
  subgraphEdit: jest.fn(() => Promise.resolve({ res: 'success' }))
}));

const defaultProps: any = {
  graphId: 1,
  ontologyId: 2,
  groupList: mockGroupList,
  graphData: mockGraph,
  initOntoData: {},
  dataInfoRef: undefined,
  prev: jest.fn(),
  next: jest.fn(),
  onCheckErr: jest.fn(),
  setOntoData: jest.fn(),
  getCanvasGraphData: jest.fn(() => mockGraph),
  onSave: jest.fn()
};
const init = (props = defaultProps) => mount(<Footer {...props} />);

describe('Footer', () => {
  it('test prev', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    expect(wrapper.props().prev).toHaveBeenCalled();
  });

  it('test check', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(1).simulate('click');
    });
    await sleep();
  });

  it('test next', async () => {
    const wrapper = init();
    // act(() => {
    //   wrapper.find('Button').at(2).simulate('click');
    // });
    // await sleep();
    // expect(wrapper.props().next).toHaveBeenCalledTimes(1);

    wrapper.setProps({
      dataInfoRef: {
        state: { checkData: { isErr: false } },
        formNameRef: { current: { validateFields: () => Promise.resolve() } }
      }
    });
    // act(() => {
    //   wrapper.find('Button').at(2).simulate('click');
    // });
    // await sleep();
    // expect(wrapper.props().next).toHaveBeenCalledTimes(2);
  });
});
