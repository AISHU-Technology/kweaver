import React from 'react';
import { shallow } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import IndexConfig from './index';
import serviceStorageManagement from '@/services/storageManagement';

const props = {
  tabsKey: 'index',
  anyDataLang: 'zh-CN'
};
const mockRes = {
  res: { total: 3, data: [{ name: '内置opensearch', user: 'root', created: 1662637067, updated: 1662637067 }] }
};
serviceStorageManagement.openSearchGet = jest.fn(() => Promise.resolve(mockRes));
serviceStorageManagement.openSearchGetById = jest.fn(() => Promise.resolve({ res: { ip: ['2'], port: ['2'] } }));

const init = (props = {}) => shallow(<IndexConfig store={store} {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    const wrapper = init(props);
    await sleep();
    expect(wrapper.state().total).toEqual(3);
    expect(wrapper.state().tableData).toEqual(mockRes.res.data);
  });
});

describe('function test', () => {
  it('test search', async () => {
    const wrapper = init(props);
    await sleep();
    wrapper.instance().searchInput = { current: { input: { value: '' } } };
    wrapper.instance().onSearch();
    wrapper.instance().currentChange();
    wrapper.instance().setSelectKey();
    wrapper.instance().closeModal();
    wrapper.instance().getIndex({ id: 1 }, 'edit');
    await sleep();
    expect(wrapper.state().total).toEqual(3);
  });

  it('visible', async () => {
    const wrapper = init(props);
    await sleep();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    expect(wrapper.state().visible).toEqual(true);
  });
});
