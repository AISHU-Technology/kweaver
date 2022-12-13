import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ModalBranchTask from './index';
import { mockData, listData } from './mockdata';
import servicesSubGraph from '@/services/subGraph';

const defaultProps = {
  visible: false,
  ontoId: 2,
  handleCancel: jest.fn(),
  goToTask: jest.fn(),
  graphId: 1
};

servicesSubGraph.subGraphGetList = jest.fn(() => Promise.resolve({ ...listData }));
servicesSubGraph.subGraphInfoDetail = jest.fn(() => Promise.resolve({ ...mockData }));
servicesSubGraph.subgraphRunTask = jest.fn(() => Promise.resolve({ res: 'success' }));

jest.mock('@/services/createEntity', () => ({
  getEntityInfo: () => Promise.resolve({ res: { df: [{ ...mockData }] } })
}));

const init = (props = defaultProps) => mount(<ModalBranchTask {...props} />);

describe('ModalBranchTask', () => {
  it('class ModalBranchTask is exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('get data', () => {
  it('test useeffect', async () => {
    const wrapper = init();
    act(() => {
      wrapper.setProps({ ...defaultProps, visible: true });
    });

    expect(servicesSubGraph.subGraphGetList).toHaveBeenCalled();

    await sleep();
    wrapper.update();

    expect(wrapper.find('.subgraph-item').length).toBe(5);

    act(() => {
      wrapper.find('.subgraph-item').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(servicesSubGraph.subGraphInfoDetail).toHaveBeenCalled();
  });

  it('check ', async () => {
    const wrapper = init();
    act(() => {
      wrapper.setProps({ ...defaultProps, visible: true });
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(0)
        .simulate('change', { target: { checked: true } });
    });
    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(1)
        .simulate('change', { target: { checked: true } });
    });
    act(() => {
      wrapper.find('.ok-btn').at(0).simulate('click');
    });
  });
});
