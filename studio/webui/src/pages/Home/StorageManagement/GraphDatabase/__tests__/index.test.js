import React from 'react';
import { shallow } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import StorageManagement from '../index';
import serviceStorageManagement from '@/services/storageManagement';

const props = {
  tabsKey: 'graph',
  anyDataLang: 'zh-CN'
};
const mockDBListRes = {
  total: 1,
  data: [
    {
      id: 1,
      name: 'nebula',
      type: 'nebula',
      count: 1,
      osName: '内置',
      user: 'root',
      updated: 1662528131,
      created: 1662528131
    }
  ]
};
serviceStorageManagement.graphDBGetList = jest.fn(() => Promise.resolve({ res: mockDBListRes }));
serviceStorageManagement.graphDBGetById = jest.fn(() =>
  Promise.resolve({ res: { ip: ['1', '2'], port: ['1,', '2'] } })
);
serviceStorageManagement.openSearchGet = jest.fn(() => Promise.resolve({ res: { data: [1] } }));

const init = (props = {}) => shallow(<StorageManagement store={store} {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    const wrapper = init(props);

    await sleep();
    expect(wrapper.state().total).toEqual(mockDBListRes.total);
    expect(wrapper.state().tableData).toEqual(mockDBListRes.data);
  });
});

describe('function test', () => {
  it('test search', async () => {
    const wrapper = init(props);

    await sleep();
    wrapper.instance().searchInput = { current: { input: { value: 'aaa' } } };
    wrapper.instance().onSearch();
    wrapper.instance().currentChange();
    wrapper.instance().closeModal();
    wrapper.instance().typeChange();
    wrapper.instance().getStorage(1);
    await sleep();
    expect(wrapper.state().total).toEqual(mockDBListRes.total);
    expect(wrapper.state().tableData).toEqual(mockDBListRes.data);
  });

  it('visible', async () => {
    const wrapper = init(props);

    await sleep();
    act(() => {
      wrapper.find('.ad-space-between Button').first().simulate('click');
    });
    await sleep();
    // expect(wrapper.state().visible).toEqual(true);
  });
});
