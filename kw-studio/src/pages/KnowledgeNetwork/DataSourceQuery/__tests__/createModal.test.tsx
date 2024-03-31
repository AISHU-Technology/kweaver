import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesDataSource from '@/services/dataSource';
import CreateModal from '../DataSourceTree/CreateModal';

// 接口mock
servicesDataSource.sourceConnectTest = jest.fn(() => Promise.resolve({ res: 'success' }));
servicesDataSource.dataSourcePut = jest.fn(() => Promise.resolve({ res: 'success' }));

const init = (props = { visible: true }) => mount(<CreateModal {...props} />);

describe('Function is called', () => {
  // 添加数据源
  it('test add as source', async () => {
    const wrapper = init();

    act(() => {
      wrapper
        .find('.ant-input')
        .at(0)
        .simulate('change', { target: { value: 'aaa' } });
    });
    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(2).simulate('click');
    });

    act(() => {
      wrapper
        .find('.ant-input')
        .at(1)
        .simulate('change', { target: { value: '10.4.69.47' } });
      wrapper
        .find('.ant-input')
        .at(2)
        .simulate('change', { target: { value: '8127' } });
      wrapper
        .find('.ant-input')
        .at(3)
        .simulate('change', { target: { value: 'root' } });
      wrapper
        .find('.ant-input')
        .at(4)
        .simulate('change', { target: { value: 'com123' } });
      wrapper
        .find('.ant-input')
        .at(5)
        .simulate('change', { target: { value: 'kom' } });
    });

    // 测试
    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    // expect(document.querySelector('.ant-message-success')).toBeTruthy();

    // 保存
    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    // expect(document.querySelector('.ant-message-success')).toBeTruthy();
  });
});
