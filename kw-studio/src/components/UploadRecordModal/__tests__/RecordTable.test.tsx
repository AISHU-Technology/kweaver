import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import RecordTable from '../Content/RecordTable';
import { mockUploadList } from './mockData';

jest.mock('@/services/uploadKnowledge', () => ({
  taskGetRelationKN: () => Promise.resolve({ res: [{ id: 1, name: '知识网络' }] })
}));

const tableState = {
  loading: false,
  keyword: '',
  page: 1,
  total: mockUploadList.res.data.length,
  order: 'created',
  reverse: 1,
  kId: 0
};
const defaultProps = {
  pageSize: 6,
  tabsKey: 'finish',
  data: mockUploadList.res.data,
  tableState,
  filterKgData: [],
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<RecordTable {...props} />);

describe('UploadRecordModal/Content/RecordTable', () => {
  it('test render', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ant-table-row').length).toBe(mockUploadList.res.data.length);
  });
  it('test search', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

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
      wrapper.find('.ant-select-item-option').at(0).simulate('click');
    });
  });

  it('test sort', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Dropdown').at(0).simulate('mouseenter');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('li').at(0).simulate('click');
    });
  });
});
