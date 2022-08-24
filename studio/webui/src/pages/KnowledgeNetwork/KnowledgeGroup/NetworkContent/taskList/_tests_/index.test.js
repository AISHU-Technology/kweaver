import React from 'react';
import { mount, shallow } from 'enzyme';
import { sleep } from '@/tests';
import store from '@/reduxConfig/store';
import TaskList from '../index';
import serviceTaskManagement from '@/services/taskManagement';
import { taskList } from './mockData';
import { act } from '@testing-library/react-hooks';
const props = {
  selectedGraph: { id: 1, kgconfid: 1 },
  tabsKey: '4',
  setGraphStatus: () => {},
  getGraphList: () => {}
};

serviceTaskManagement.taskGet = jest.fn(() => Promise.resolve(taskList));
serviceTaskManagement.taskGetProgress = jest.fn(() =>
  Promise.resolve({
    res: {
      df: [
        {
          graph_name: '123',
          graph_id: 1,
          task_status: 1,
          create_user_name: 1,
          create_time: 'full',
          create_user_email: 1,
          effective_storage: true
        }
      ],
      count: 1
    }
  })
);
serviceTaskManagement.taskDelete = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceTaskManagement.taskStop = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceTaskManagement.taskCreate = jest.fn(() => Promise.resolve({ res: 1 }));
serviceTaskManagement.taskGetDetail = jest.fn(() => Promise.resolve({ Code: 500403 }));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() })
}));

const init = (props = {}) => mount(<TaskList {...props} store={store} />);

describe('UI test', () => {
  it('should render', async () => {
    const wrapper = init(props);

    await sleep();
    expect(serviceTaskManagement.taskGet).toBeCalled();
  });
});

describe('fun test', () => {
  it('search select', async () => {
    const wrapper = init(props);

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
    const wrapper = init(props);

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
});

describe('option', () => {
  it('run btn', async () => {
    serviceTaskManagement.taskGet = jest.fn(() =>
      Promise.resolve({
        res: {
          df: [
            {
              graph_name: '123',
              graph_id: 1,
              task_status: 'normal',
              id: 1,
              task_type: 'full',
              trigger_type: 1,
              effective_storage: true
            },
            {
              graph_name: '123',
              graph_id: 1,
              task_status: 'running',
              id: 2,
              task_type: 'full',
              trigger_type: 1,
              effective_storage: true
            }
          ],
          count: 1
        }
      })
    );
    const wrapper = init(props);

    await sleep();

    expect(serviceTaskManagement.taskGet).toBeCalled();

    const runBtn = wrapper.find('Button');

    act(() => {
      runBtn.at(0).simulate('click');
    });
    await sleep();

    const okBtn = wrapper.find('.ant-btn.save');

    act(() => {
      okBtn.at(0).simulate('click');
    });
    await sleep();

    expect(serviceTaskManagement.taskCreate).toBeCalled();
    const statusBtn = wrapper.find('.status-button');

    act(() => {
      statusBtn.at(0).simulate('click');
    });
    await sleep();
    expect(serviceTaskManagement.taskGetProgress).toBeCalled();
  });
});
