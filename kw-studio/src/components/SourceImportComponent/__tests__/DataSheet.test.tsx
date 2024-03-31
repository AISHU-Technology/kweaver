import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import servicesCreateEntity from '@/services/createEntity';
import DataSheet from '../DataSheet';
import { mockDs } from './mockData';

const mockList = ['sheet1', 'sheet2'];
servicesCreateEntity.getDataList = jest.fn(() =>
  Promise.resolve({
    res: { output: mockList }
  })
);

const defaultProps = {
  source: mockDs[0], // 列表数据
  checkedValues: [], // 勾选的数据
  selectedKey: undefined, // 选中的数据
  errors: {},
  onChange: jest.fn(),
  onNameClick: jest.fn()
};
const init = (props = defaultProps) => mount(<DataSheet {...props} />);

describe('AddSourceModal/DataSheet', () => {
  it('test render', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    expect(wrapper.find('.sheet-item').length).toBe(mockList.length);
  });

  it('test interactive', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

    // check
    act(() => {
      wrapper.find('.sheet-item').at(0).simulate('click');
    });
    // expect(wrapper.props().onChange).toHaveBeenCalled();

    // click name
    act(() => {
      wrapper.find('.s-name').at(0).simulate('click');
    });
    expect(wrapper.props().onNameClick).toHaveBeenCalled();

    // search
    triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { persist: jest.fn(), target: { value: '任意关键字' } });
    await sleep(333);
    wrapper.update();
    expect(wrapper.find('.sheet-item').length).toBe(0);
  });
});
