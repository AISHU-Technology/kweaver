import React from 'react';
import { shallow } from 'enzyme';
import { sleep } from '@/tests';
import store from '@/reduxConfig/store';
import StorageManagement from '../index';
import serviceStorageManagement from '@/services/storageManagement';

const props = {
  tabsKey: 'graph',
  anyDataLang: 'zh-CN'
};

serviceStorageManagement.graphDBGetList = jest.fn(() => Promise.resolve({ res: { total: 3, data: [] } }));
serviceStorageManagement.graphDBGetById = jest.fn(() =>
  Promise.resolve({ res: { ip: ['1', '2'], port: ['1,', '2'] } })
);

const init = (props = {}) => shallow(<StorageManagement store={store} {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    const wrapper = init(props);

    await sleep();
    expect(wrapper.state().total).toEqual(3);
    expect(wrapper.state().tableData).toEqual([]);
  });
});

describe('function test', () => {
  it('test search', async () => {
    const wrapper = init(props);

    await sleep();
    wrapper.instance().searchInput = { current: { input: { value: 'aaa' } } };
    wrapper.instance().onSearch();
    wrapper.instance().currentChange();

    wrapper.instance().setSelectKey();

    wrapper.instance().closeModal();
    wrapper.instance().typeChange();
    wrapper.instance().getStorage(1);
    await sleep();
    expect(wrapper.state().total).toEqual(3);
    expect(wrapper.state().tableData).toEqual([]);
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
