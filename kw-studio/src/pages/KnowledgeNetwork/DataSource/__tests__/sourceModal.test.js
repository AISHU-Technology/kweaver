import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesDataSource from '@/services/dataSource';
import SourceModal from '../SourceModal/index';

// 接口mock
servicesDataSource.asAuthGet = jest.fn(() => Promise.resolve({ res: { ds_auth: 1, ds_url: 'https://test' } }));
servicesDataSource.sourceConnectTest = jest.fn(() => Promise.resolve({ res: 'success' }));
servicesDataSource.dataSourcePut = jest.fn(() => Promise.resolve({ res: 'success' }));

const formInfo = {
  create_time: '2021-12-27 09:38:22',
  create_user: '853ba1db-4e37-11eb-a57d-0242ac190002',
  create_user_email: '--',
  create_user_name: 'admin',
  dataType: 'structured',
  data_source: 'rabbitmq',
  ds_address: '10.4.109.191',
  ds_auth: '11',
  ds_password: 'kweaver123',
  ds_path: 'test',
  ds_port: 5672,
  ds_user: 'admin',
  dsname: 'test001111',
  extract_type: 'standardExtraction',
  id: 1,
  json_schema: '{"name": "xiaoming"}',
  queue: 'test1',
  update_time: '2021-12-27 09:38:22',
  update_user: '853ba1db-4e37-11eb-a57d-0242ac190002',
  update_user_email: '--',
  update_user_name: 'admin',
  vhost: 'test'
};
const init = (props = {}) => mount(<SourceModal {...props} />);

describe('UI is render', () => {
  // 新建
  it('test init by create', async () => {
    const wrapper = init({ visible: true, operation: 'create' });

    // expect(wrapper.find('.modal-title').text()).toBe('新建数据源');
    expect(wrapper.find('.form-row').at(1).find('.ant-select-selection-item').text()).toBe('MySQL');

    // 切换as
    act(() => {
      wrapper.find('.form-row').at(1).find('.ant-select-selector').simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.form-row').at(1).find('.ant-select-item-option').at(2).simulate('click');
    });
    await sleep();
    // expect(wrapper.find('.form-row').at(1).find('.ant-select-selection-item').text()).toBe('PostgreSQL (支持10~15)');
  });

  // 编辑
  it('test init by edit', async () => {
    const wrapper = init({ visible: true, operation: 'edit', formInfo });

    // expect(wrapper.find('.modal-title').text()).toBe('编辑数据源');

    // MQ
    expect(JSON.parse(wrapper.find('textarea').props().value)).toEqual(JSON.parse(formInfo.json_schema));

    // as
    const asForm = { ...formInfo, data_source: 'as7' };
    const asWrapper = init({ visible: true, operation: 'edit', formInfo: asForm });

    expect(asWrapper.find('.auth-button-2').exists()).toBe(true);
  });

  // 复制
  it('test init by copy', async () => {
    const wrapper = init({ visible: true, operation: 'copy', formInfo });

    // expect(wrapper.find('.modal-title').text()).toBe('复制数据源');
  });
});

describe('Function is called', () => {
  // as授权并添加数据源
  it('test add as source', async () => {
    Object.defineProperty(window, 'open', { value: jest.fn() });

    const asForm = { ...formInfo, data_source: 'as7' };
    const asWrapper = init({ visible: true, operation: 'edit', formInfo: asForm });

    // 授权
    act(() => {
      asWrapper.find('.reauthorize-button').at(0).simulate('click');
    });
    await sleep();
    asWrapper.update();
    act(() => {
      asWrapper.find('.auth-button-1').at(0).simulate('click');
    });
    asWrapper.update();

    // 测试
    act(() => {
      asWrapper.find('.test-btn').at(0).simulate('click');
    });
    await sleep();
    asWrapper.update();
    expect(document.querySelector('.ant-message-success')).toBeTruthy();

    // 保存
    act(() => {
      asWrapper.find('.save-btn').at(0).simulate('click');
    });
    await sleep();
    asWrapper.update();
    expect(document.querySelector('.ant-message-success')).toBeTruthy();
  });

  // MQ数据源
  it('test add MQ source', async () => {
    const wrapper = init({ visible: true, operation: 'edit', formInfo });

    act(() => {
      wrapper
        .find('TextArea')
        .at(0)
        .simulate('change', { target: { value: '{ "key": "test" }' } });
    });

    // 测试
    act(() => {
      wrapper.find('.test-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(document.querySelector('.ant-message-success')).toBeTruthy();

    // 保存
    act(() => {
      wrapper.find('.save-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(document.querySelector('.ant-message-success')).toBeTruthy();
  });
});
