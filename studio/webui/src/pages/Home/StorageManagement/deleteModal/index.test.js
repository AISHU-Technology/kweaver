import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import serviceStorageManagement from '@/services/storageManagement';
import DeleteModal from './index';

const props = {
  visible: true,
  delType: 'graph',
  deleteItem: { name: 'bbb' },
  setVisible: jest.fn(),
  getData: jest.fn()
};

serviceStorageManagement.graphDBDelete = jest.fn(() => Promise.resolve({ res: 'success' }));
const init = (props = {}) => mount(<DeleteModal {...props} />);

describe('UI render', () => {
  it('render test', async () => {
    init(props);
    await sleep();
  });
});

describe('Function', () => {
  it('ok btn', async () => {
    const wrapper = init(props);

    const input = wrapper.find('.input').at(0);
    input.simulate('change', { target: { value: 'bbb' } });

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
    expect(serviceStorageManagement.graphDBDelete).toBeCalled();
  });

  it('cancel btn', async () => {
    const wrapper = init(props);

    const cancel = wrapper.find('.ant-btn-default .delete-cancel').at(0);

    act(() => {
      cancel.simulate('click');
    });
    await sleep();

    expect(props.setVisible).toHaveBeenCalled();
  });
});

describe('error text', () => {
  it('error', async () => {
    serviceStorageManagement.graphDBDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Manager.Common.ServerError' })
    );

    const wrapper = init(props);

    const input = wrapper.find('.input').at(0);

    input.simulate('change', { target: { value: 'aaa' } });

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });

  it('dbErr', async () => {
    serviceStorageManagement.graphDBDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Manager.GraphDB.GraphDBRecordNotFoundError' })
    );

    const wrapper = init(props);

    const input = wrapper.find('.input').at(0);

    input.simulate('change', { target: { value: 'bbb' } });

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });

  it('InsufficientAccountPermissionsError', async () => {
    serviceStorageManagement.graphDBDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Manager.Account.InsufficientAccountPermissionsError' })
    );

    const props = {
      visible: true,
      delType: 'index',
      deleteItem: { name: 'bbb' },
      setVisible: jest.fn(),
      getData: jest.fn()
    };

    const wrapper = init(props);

    const input = wrapper.find('.input').at(0);

    input.simulate('change', { target: { value: 'bbb' } });

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });
});
