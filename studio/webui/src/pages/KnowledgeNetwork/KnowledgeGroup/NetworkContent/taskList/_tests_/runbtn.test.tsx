import React from 'react';
import { mount } from 'enzyme';
import RunBtn from '../RunButton';
import { sleep } from '@/tests';
import { act } from 'react-test-renderer';

const props = {
  isRunning: false,
  handleRunNow: jest.fn(),
  selectedGraph: {
    create_time: '2022-06-27 13:40:16',
    create_user: 'stefan',
    display_task: true,
    export: false,
    graph_des: 'test_error',
    graphdb_name: 'u9f6fcdb4f5db11ecb7079af371d61d07',
    id: 53,
    is_import: false,
    is_upload: false,
    kg_conf_id: 53,
    name: 'test_error',
    property_id: 1,
    status: 'failed',
    step_num: 6,
    otl: '[0]',
    update_time: '2022-07-01 16:21:28',
    update_user: 'stefan'
  },
  Ok: jest.fn()
};
const init = (props: any) => mount(<RunBtn {...props} />);

describe('RunBtn', () => {
  it('class RunBtn is exists', () => {
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});

describe('event', () => {
  it('run now', async () => {
    const wrapper = init(props);
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.run').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-dropdown-menu-item.ant-dropdown-menu-item-only-child').last().simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.save').at(0).simulate('click');
    });

    expect(props.handleRunNow).toHaveBeenCalled();
  });

  it('branch task', async () => {
    const wrapper = init(props);
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.run').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-dropdown-menu-item.ant-dropdown-menu-item-only-child').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.ant-modal-close-x').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
  });
});
