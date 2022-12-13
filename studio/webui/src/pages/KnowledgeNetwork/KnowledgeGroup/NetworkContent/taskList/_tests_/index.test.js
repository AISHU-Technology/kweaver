import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import store from '@/reduxConfig/store';
import TaskList from '../index';
import serviceTaskManagement from '@/services/taskManagement';
import { taskList } from './mockData';
import { act } from '@testing-library/react-hooks';
const defaultProps = {
  selectedGraph: { id: 1, kg_conf_id: 1 },
  tabsKey: '3',
  onUpdateGraphStatus: jest.fn()
};

serviceTaskManagement.taskGet = jest.fn(() => Promise.resolve(taskList));
serviceTaskManagement.taskGetProgress = jest.fn(() =>
  Promise.resolve({
    res: {
      graph_name: '123',
      graph_id: 1,
      task_status: 'running',
      create_user_name: 1,
      create_time: 'full',
      create_user_email: 1,
      effective_storage: true,
      task_id: 1
    },
    count: 1
  })
);
serviceTaskManagement.taskDelete = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceTaskManagement.taskStop = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceTaskManagement.taskCreate = jest.fn(() => Promise.resolve({ res: 1 }));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() })
}));

const init = (props = defaultProps) => mount(<TaskList {...props} store={store} />);

describe('UI test', () => {
  it('should render', async () => {
    init();
    await sleep();
    expect(serviceTaskManagement.taskGet).toBeCalled();
  });
});

describe('fun test', () => {
  it('search select', async () => {
    const wrapper = init();

    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    await sleep();
    expect(serviceTaskManagement.taskGet).toBeCalled();

    const page = wrapper.find('.task-management-table-pagination').at(0);

    act(() => {
      page.simulate('click');
    });
    await sleep();
    expect(serviceTaskManagement.taskGet).toBeCalled();
  });

  it('status', async () => {
    const wrapper = init();

    act(() => {
      wrapper.find('.ant-select-selector').at(2).simulate('mousedown');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    await sleep();
    expect(serviceTaskManagement.taskGet).toBeCalled();
  });

  it('test', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    // 刷新
    act(() => {
      wrapper.find('.btn-height').at(0).simulate('click');
    });

    expect(serviceTaskManagement.taskGet).toHaveBeenCalled();
    // 任务进度
    act(() => {
      wrapper.find('.status-button').at(0).simulate('click');
    });

    expect(serviceTaskManagement.taskGetProgress).toHaveBeenCalled();

    act(() => {
      wrapper.find('.ant-btn.ant-btn-default.ad-ml-2').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    expect(wrapper.hasClass('ad-tip-modal')).toBeDefined();
  });
});
