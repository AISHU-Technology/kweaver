import React from 'react';
import { shallow } from 'enzyme';
import { sleep } from '@/tests';
import store from '@/reduxConfig/store';
import IndexConfig from './index';
import serviceStorageManagement from '@/services/storageManagement';

const props = {
  tabsKey: 'index',
  anyDataLang: 'zh-CN'
};

serviceStorageManagement.openSearchGet = jest.fn(() =>
  Promise.resolve({
    res: { total: 3, data: [{ name: '内置opensearch', user: 'root', created: '2022-07-01', updated: '2022-07-02' }] }
  })
);
serviceStorageManagement.openSearchGetById = jest.fn(() => Promise.resolve({ res: { ip: ['2'], port: ['2'] } }));

const init = (props = {}) => shallow(<IndexConfig store={store} {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    const wrapper = init(props);

    await sleep();
    expect(wrapper.state().total).toEqual(3);
    expect(wrapper.state().tableData).toEqual([
      { name: '内置opensearch', user: 'root', created: '2022-07-01', updated: '2022-07-02' }
    ]);
  });
});

describe('function test', () => {
  it('test search', async () => {
    const wrapper = init(props);

    await sleep();
    wrapper.instance().searchInput = { current: { input: { value: '' } } };

    // const input = wrapper.find();

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
    const item = wrapper.find('.new-botton');

    item.at(0).simulate('click');
    await sleep();
    expect(wrapper.state().visible).toEqual(true);
  });
});
