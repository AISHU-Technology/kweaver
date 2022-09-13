import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import serviceStorageManagement from '@/services/storageManagement';
import Created from './index';

const props = {
  visible: true,
  closeModal: jest.fn(),
  optionType: 'create',
  optionStorage: Object,
  getAuthCodeType: jest.fn(),
  initData: jest.fn(),
  getData: jest.fn()
};

serviceStorageManagement.openSearchCreate = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceStorageManagement.openSearchUpdate = jest.fn(() => Promise.resolve({ res: 'success' }));
serviceStorageManagement.openSearchTest = jest.fn(() => Promise.resolve({ res: 'success' }));

const init = (props = {}) => mount(<Created {...props} />);

describe('Function test', () => {
  it('ok btn click', async () => {
    const wrapper = init(props);

    await sleep();

    act(() => {
      wrapper
        .find('.name-input')
        .at(0)
        .simulate('change', { target: { value: 'ygname' } });
      wrapper
        .find('.user-input')
        .at(0)
        .simulate('change', { target: { value: 'admin' } });
      wrapper
        .find('.pass-input')
        .at(0)
        .simulate('change', { target: { value: 'admin' } });
      wrapper
        .find('.ip-input')
        .at(0)
        .simulate('change', { target: { value: '1.2.3.4' } });
      wrapper
        .find('.port-input')
        .at(0)
        .simulate('change', { target: { value: '90' } });
    });

    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.btn.primary').at(0).simulate('click');
    });
    await sleep();

    expect(serviceStorageManagement.openSearchCreate).toHaveBeenCalled();

    act(() => {
      wrapper.find('.ant-btn-default .btn-cancel').at(0).simulate('click');
    });
    await sleep();

    expect(serviceStorageManagement.openSearchTest).toHaveBeenCalled();
  });
});

describe('Function test', () => {
  it('edit', async () => {
    const wrapper = init({ ...props, optionType: 'edit' });

    await sleep();
    act(() => {
      wrapper
        .find('.name-input')
        .at(0)
        .simulate('change', { target: { value: 'ygname' } });
      wrapper
        .find('.user-input')
        .at(0)
        .simulate('change', { target: { value: 'admin' } });
      wrapper
        .find('.pass-input')
        .at(0)
        .simulate('change', { target: { value: 'admin' } });
      wrapper
        .find('.ip-input')
        .at(0)
        .simulate('change', { target: { value: '1.2.3.4' } });
      wrapper
        .find('.port-input')
        .at(0)
        .simulate('change', { target: { value: '90' } });
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('.btn.primary').at(0).simulate('click');
    });
    await sleep();

    expect(serviceStorageManagement.openSearchUpdate).toHaveBeenCalled();
  });
});
